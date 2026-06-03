import { InternalServerErrorException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { SupabaseService } from "../../core/supabase/supabase.service";
import {
  buildSupabaseQueryMock,
  createSupabaseServiceMock,
} from "../../test-utils/supabase-query.mock";
import { UserRepository } from "./user.repository";

describe("UserRepository", () => {
  let repository: UserRepository;
  let userClient: ReturnType<typeof buildSupabaseQueryMock>;

  beforeEach(async () => {
    userClient = buildSupabaseQueryMock({ data: null, error: null });
    const supabase = createSupabaseServiceMock(userClient);

    const module: TestingModule = await Test.createTestingModule({
      providers: [UserRepository, { provide: SupabaseService, useValue: supabase }],
    }).compile();

    repository = module.get(UserRepository);
  });

  it("findById retourne un profil mappé", async () => {
    const row = {
      id: "user-1",
      display_name: "alice",
      website_url: null,
      pending_auto_analyze: false,
      created_at: "2024-01-01T00:00:00.000Z",
      updated_at: "2024-01-01T00:00:00.000Z",
    };
    userClient.maybeSingle.mockResolvedValueOnce({ data: row, error: null });

    const user = await repository.findById("user-1", "token");

    expect(user?.username).toBe("alice");
    expect(user?.pendingAutoAnalyze).toBe(false);
  });

  it("findById lève InternalServerErrorException sur erreur Supabase", async () => {
    userClient.maybeSingle.mockResolvedValueOnce({
      data: null,
      error: { message: "fail" },
    });

    await expect(repository.findById("user-1", "token")).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );
  });
});
