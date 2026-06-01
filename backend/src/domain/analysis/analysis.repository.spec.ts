import { InternalServerErrorException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { SupabaseService } from "../../core/supabase/supabase.service";
import {
  buildSupabaseQueryMock,
  createSupabaseServiceMock,
} from "../../test-utils/supabase-query.mock";
import { AnalysisRepository } from "./analysis.repository";

describe("AnalysisRepository", () => {
  let repository: AnalysisRepository;
  let adminClient: ReturnType<typeof buildSupabaseQueryMock>;

  beforeEach(async () => {
    const userClient = buildSupabaseQueryMock({ data: null, error: null });
    adminClient = buildSupabaseQueryMock({ data: null, error: null });
    const supabase = createSupabaseServiceMock(userClient);
    supabase.admin = adminClient as typeof supabase.admin;

    const module: TestingModule = await Test.createTestingModule({
      providers: [AnalysisRepository, { provide: SupabaseService, useValue: supabase }],
    }).compile();

    repository = module.get(AnalysisRepository);
  });

  it("transferToUser lève InternalServerErrorException sans exposer le message Supabase", async () => {
    adminClient.update.mockReturnValue(adminClient);
    adminClient.eq.mockResolvedValue({ error: { message: "secret db detail" } });

    await expect(repository.transferToUser("sess", "user-1")).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );
  });
});
