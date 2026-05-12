import {
  BadRequestException,
  HttpStatus,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { AllHttpExceptionsFilter } from "./http-exception.filter";

function makeMockHost(url = "/api/test", method = "GET") {
  const mockReply = {
    status: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
  };
  const mockRequest = { url, method };

  return {
    switchToHttp: () => ({
      getResponse: () => mockReply,
      getRequest: () => mockRequest,
    }),
    mockReply,
  };
}

describe("AllHttpExceptionsFilter", () => {
  let filter: AllHttpExceptionsFilter;
  const originalEnv = process.env["NODE_ENV"];

  beforeEach(() => {
    filter = new AllHttpExceptionsFilter();
    process.env["NODE_ENV"] = "development";
  });

  afterEach(() => {
    process.env["NODE_ENV"] = originalEnv;
  });

  it("sérialise une NotFoundException en 404", () => {
    const { mockReply, ...host } = makeMockHost("/api/analyses/unknown");
    filter.catch(new NotFoundException("Analysis not found"), host as never);

    expect(mockReply.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    const body = mockReply.send.mock.calls[0][0] as Record<string, unknown>;
    expect(body.statusCode).toBe(404);
    expect(body.message).toBe("Analysis not found");
    expect(body.path).toBe("/api/analyses/unknown");
    expect(typeof body.timestamp).toBe("string");
  });

  it("sérialise une UnauthorizedException en 401", () => {
    const { mockReply, ...host } = makeMockHost();
    filter.catch(new UnauthorizedException("Missing token"), host as never);

    expect(mockReply.status).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
    const body = mockReply.send.mock.calls[0][0] as Record<string, unknown>;
    expect(body.statusCode).toBe(401);
    expect(body.message).toBe("Missing token");
  });

  it("extrait le tableau de messages d'une BadRequestException Zod", () => {
    const { mockReply, ...host } = makeMockHost();
    const exception = new BadRequestException({
      message: ["url: URL invalide", "url: Required"],
      error: "Bad Request",
      statusCode: 400,
    });
    filter.catch(exception, host as never);

    const body = mockReply.send.mock.calls[0][0] as Record<string, unknown>;
    expect(body.statusCode).toBe(400);
    expect(Array.isArray(body.message)).toBe(true);
    expect(body.message).toContain("url: URL invalide");
  });

  it("retourne 500 pour une erreur non-NestJS en développement (message exposé)", () => {
    const { mockReply, ...host } = makeMockHost();
    filter.catch(new Error("Supabase connection failed"), host as never);

    const body = mockReply.send.mock.calls[0][0] as Record<string, unknown>;
    expect(body.statusCode).toBe(500);
    expect(body.message).toBe("Supabase connection failed");
  });

  it("masque le message en production pour les erreurs 500", () => {
    process.env["NODE_ENV"] = "production";
    const { mockReply, ...host } = makeMockHost();
    filter.catch(new Error("DB credentials leaked"), host as never);

    const body = mockReply.send.mock.calls[0][0] as Record<string, unknown>;
    expect(body.statusCode).toBe(500);
    expect(body.message).toBe("Internal server error");
    expect(body.message).not.toContain("leaked");
  });

  it("gère une exception non-Error (string throw)", () => {
    const { mockReply, ...host } = makeMockHost();
    filter.catch("quelque chose s'est mal passé", host as never);

    const body = mockReply.send.mock.calls[0][0] as Record<string, unknown>;
    expect(body.statusCode).toBe(500);
  });
});
