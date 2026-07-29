import { BadRequestException, InternalServerErrorException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { SupabaseService } from "../../core/supabase/supabase.service";
import {
  buildSupabaseQueryMock,
  createSupabaseServiceMock,
} from "../../test-utils/supabase-query.mock";
import { AnalysisRepository } from "./analysis.repository";

const analysisRow = {
  id: "a1",
  url: "https://shop.test",
  status: "pending",
  error_code: null,
  error_message: null,
  user_id: "user-1",
  session_id: null,
  shop_id: null,
  created_at: "2024-01-01T00:00:00.000Z",
};

describe("AnalysisRepository", () => {
  let repository: AnalysisRepository;
  let adminClient: ReturnType<typeof buildSupabaseQueryMock>;
  let supabase: ReturnType<typeof createSupabaseServiceMock>;

  beforeEach(async () => {
    const userClient = buildSupabaseQueryMock({ data: null, error: null });
    adminClient = buildSupabaseQueryMock({ data: null, error: null });
    supabase = createSupabaseServiceMock(userClient);
    supabase.admin = adminClient as typeof supabase.admin;

    const module: TestingModule = await Test.createTestingModule({
      providers: [AnalysisRepository, { provide: SupabaseService, useValue: supabase }],
    }).compile();

    repository = module.get(AnalysisRepository);
  });

  it("findById utilise admin et mappe l'entité", async () => {
    adminClient.maybeSingle.mockResolvedValueOnce({ data: analysisRow, error: null });

    const analysis = await repository.findById("a1", "token");

    expect(supabase.forUser).not.toHaveBeenCalled();
    expect(adminClient.from).toHaveBeenCalledWith("analyses");
    expect(analysis?.userId).toBe("user-1");
  });

  it("findAllByUser utilise admin filtré par user_id", async () => {
    adminClient.order.mockResolvedValueOnce({ data: [analysisRow], error: null });

    const list = await repository.findAllByUser("user-1", "token");

    expect(supabase.forUser).not.toHaveBeenCalled();
    expect(adminClient.eq).toHaveBeenCalledWith("user_id", "user-1");
    expect(list).toHaveLength(1);
  });

  it("create utilise toujours admin (authentifié ou guest)", async () => {
    adminClient.single.mockResolvedValueOnce({ data: analysisRow, error: null });

    const created = await repository.create(
      { url: "https://shop.test", userId: "user-1", sessionId: null },
      "token",
    );

    expect(supabase.forUser).not.toHaveBeenCalled();
    expect(adminClient.insert).toHaveBeenCalled();
    expect(created.id).toBe("a1");
  });

  it("updateStatus authentifié utilise admin filtré par id uniquement", async () => {
    adminClient.eq.mockResolvedValueOnce({ error: null });

    await repository.updateStatus("a1", { status: "running" }, "token");

    expect(supabase.forUser).not.toHaveBeenCalled();
    expect(adminClient.update).toHaveBeenCalled();
    expect(adminClient.eq).toHaveBeenCalledWith("id", "a1");
    expect(adminClient.eq).not.toHaveBeenCalledWith("session_id", expect.anything());
  });

  it("updateStatus guest filtre aussi par session_id", async () => {
    adminClient.eq.mockReturnValue(adminClient);
    // Second eq (session_id) résout la promesse
    adminClient.eq.mockImplementation((col: string) => {
      if (col === "session_id") {
        return Promise.resolve({ error: null });
      }
      return adminClient;
    });

    await repository.updateStatus("a1", { status: "done" }, "", "guest-sess");

    expect(adminClient.eq).toHaveBeenCalledWith("id", "a1");
    expect(adminClient.eq).toHaveBeenCalledWith("session_id", "guest-sess");
  });

  it("updateStatus refuse sans accessToken ni guestSessionId", async () => {
    await expect(repository.updateStatus("a1", { status: "running" }, "")).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it("transferToUser lève InternalServerErrorException sans exposer le message Supabase", async () => {
    adminClient.update.mockReturnValue(adminClient);
    adminClient.eq.mockResolvedValue({ error: { message: "secret db detail" } });

    await expect(repository.transferToUser("sess", "user-1")).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );
  });
});
