import { InternalServerErrorException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { SupabaseService } from "../../core/supabase/supabase.service";
import {
  buildSupabaseQueryMock,
  createSupabaseServiceMock,
} from "../../test-utils/supabase-query.mock";
import { ProductTemplateRepository } from "./product-template.repository";

describe("ProductTemplateRepository", () => {
  let repository: ProductTemplateRepository;
  let userClient: ReturnType<typeof buildSupabaseQueryMock>;

  beforeEach(async () => {
    userClient = buildSupabaseQueryMock({ data: null, error: null });
    const supabase = createSupabaseServiceMock(userClient);

    const module: TestingModule = await Test.createTestingModule({
      providers: [ProductTemplateRepository, { provide: SupabaseService, useValue: supabase }],
    }).compile();

    repository = module.get(ProductTemplateRepository);
  });

  it("findById retourne un gabarit avec champs ordonnés", async () => {
    const row = {
      id: "tpl-1",
      name: "Presta",
      shop_id: "shop-1",
      client_id: "user-1",
      fields: [{ name: "Nom", type: "text", required: true }],
      created_at: "2024-01-01T00:00:00.000Z",
      updated_at: "2024-01-01T00:00:00.000Z",
    };
    userClient.maybeSingle.mockResolvedValueOnce({ data: row, error: null });

    const template = await repository.findById("tpl-1", "token");

    expect(template?.shopId).toBe("shop-1");
    expect(template?.fields[0]?.order).toBe(0);
  });

  it("findById lève InternalServerErrorException sur erreur Supabase", async () => {
    userClient.maybeSingle.mockResolvedValueOnce({
      data: null,
      error: { message: "fail" },
    });

    await expect(repository.findById("tpl-1", "token")).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );
  });
});
