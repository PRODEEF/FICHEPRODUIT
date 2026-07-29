import { Test, TestingModule } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import { HttpStatus } from "@nestjs/common";
import type { FastifyReply } from "fastify";
import { HealthController } from "./health.controller";
import { HealthService } from "./health.service";
import { SupabaseService } from "../../core/supabase/supabase.service";

const mockSupabaseService = {
  admin: {
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue({ error: null }),
      }),
    }),
  },
};

const mockConfigService = {
  get: jest.fn().mockReturnValue("test"),
};

function mockReply(): FastifyReply {
  return {
    status: jest.fn().mockReturnThis(),
  } as unknown as FastifyReply;
}

describe("HealthController", () => {
  let controller: HealthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        HealthService,
        { provide: SupabaseService, useValue: mockSupabaseService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it("retourne ok quand la DB répond", async () => {
    const res = mockReply();
    const result = await controller.getHealth(res);

    expect(result.status).toBe("ok");
    expect(result.environment).toBe("test");
    expect(result.services.database).toBe("ok");
    expect(result.timestamp).toBeDefined();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("retourne degraded avec HTTP 503 quand la DB est KO", async () => {
    mockSupabaseService.admin.from.mockReturnValueOnce({
      select: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue({
          error: { code: "CONNECTION_ERROR", message: "db unreachable" },
        }),
      }),
    });

    const res = mockReply();
    const result = await controller.getHealth(res);

    expect(result.status).toBe("degraded");
    expect(result.services.database).toBe("error");
    expect(res.status).toHaveBeenCalledWith(HttpStatus.SERVICE_UNAVAILABLE);
  });

  it("retourne degraded avec HTTP 503 si la DB throw", async () => {
    mockSupabaseService.admin.from.mockReturnValueOnce({
      select: jest.fn().mockReturnValue({
        limit: jest.fn().mockRejectedValue(new Error("timeout")),
      }),
    });

    const res = mockReply();
    const result = await controller.getHealth(res);

    expect(result.status).toBe("degraded");
    expect(result.services.database).toBe("error");
    expect(res.status).toHaveBeenCalledWith(HttpStatus.SERVICE_UNAVAILABLE);
  });

  it("retourne ok si PGRST116 (table vide)", async () => {
    mockSupabaseService.admin.from.mockReturnValueOnce({
      select: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue({
          error: { code: "PGRST116", message: "not found" },
        }),
      }),
    });

    const res = mockReply();
    const result = await controller.getHealth(res);

    expect(result.status).toBe("ok");
    expect(result.services.database).toBe("ok");
    expect(res.status).not.toHaveBeenCalled();
  });

  it("retourne ok si 42P01 (table inexistante)", async () => {
    mockSupabaseService.admin.from.mockReturnValueOnce({
      select: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue({
          error: { code: "42P01", message: "relation does not exist" },
        }),
      }),
    });

    const res = mockReply();
    const result = await controller.getHealth(res);

    expect(result.status).toBe("ok");
    expect(result.services.database).toBe("ok");
    expect(res.status).not.toHaveBeenCalled();
  });
});
