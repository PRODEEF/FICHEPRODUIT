import { InternalServerErrorException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { SupabaseService } from "../../core/supabase/supabase.service";
import {
  buildSupabaseQueryMock,
  createSupabaseServiceMock,
} from "../../test-utils/supabase-query.mock";
import { ShopRepository } from "./shop.repository";

describe("ShopRepository", () => {
  let repository: ShopRepository;
  let userClient: ReturnType<typeof buildSupabaseQueryMock>;
  let supabase: ReturnType<typeof createSupabaseServiceMock>;

  beforeEach(async () => {
    userClient = buildSupabaseQueryMock({ data: null, error: null });
    supabase = createSupabaseServiceMock(userClient);

    const module: TestingModule = await Test.createTestingModule({
      providers: [ShopRepository, { provide: SupabaseService, useValue: supabase }],
    }).compile();

    repository = module.get(ShopRepository);
  });

  it("findById retourne une boutique mappée", async () => {
    const row = {
      id: "shop-1",
      name: "Ma boutique",
      url: "https://example.com",
      cms: "prestashop",
      sector: "Glisse",
      brands: [],
      categories: [],
      user_id: "user-1",
      session_id: null,
      created_at: "2024-01-01T00:00:00.000Z",
      updated_at: "2024-01-01T00:00:00.000Z",
    };
    userClient.maybeSingle.mockResolvedValueOnce({ data: row, error: null });

    const shop = await repository.findById("shop-1", "token");

    expect(shop?.id).toBe("shop-1");
    expect(shop?.ownerId).toBe("user-1");
    expect(supabase.forUser).toHaveBeenCalledWith("token");
  });

  it("findById retourne null sans erreur PostgREST inattendue", async () => {
    userClient.maybeSingle.mockResolvedValueOnce({ data: null, error: null });

    await expect(repository.findById("missing", "token")).resolves.toBeNull();
  });

  it("findById lève InternalServerErrorException sur erreur Supabase", async () => {
    userClient.maybeSingle.mockResolvedValueOnce({
      data: null,
      error: { code: "500", message: "DB error" },
    });

    await expect(repository.findById("shop-1", "token")).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );
  });
});
