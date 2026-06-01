import { InternalServerErrorException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { SupabaseService } from "../../core/supabase/supabase.service";
import {
  buildSupabaseQueryMock,
  createSupabaseServiceMock,
} from "../../test-utils/supabase-query.mock";
import { CatalogRepository } from "./catalog.repository";

describe("CatalogRepository", () => {
  let repository: CatalogRepository;
  let anonClient: ReturnType<typeof buildSupabaseQueryMock>;

  beforeEach(async () => {
    anonClient = buildSupabaseQueryMock({ data: null, error: null });
    const supabase = createSupabaseServiceMock(anonClient);
    supabase.anon = anonClient as typeof supabase.anon;

    const module: TestingModule = await Test.createTestingModule({
      providers: [CatalogRepository, { provide: SupabaseService, useValue: supabase }],
    }).compile();

    repository = module.get(CatalogRepository);
  });

  it("findById retourne un produit mappé", async () => {
    const row = {
      id: "prod-1",
      name: "Planche",
      brand: "Brand",
      sector: "Glisse",
      category: "Surf",
      sub_category: null,
      year: 2024,
      price: 100,
      description: "Desc",
      images: [],
      url: "https://x.com",
      attributes: {},
    };
    anonClient.maybeSingle.mockResolvedValueOnce({ data: row, error: null });

    const product = await repository.findById("prod-1");

    expect(product?.name).toBe("Planche");
    expect(product?.subCategory).toBeNull();
  });

  it("findById lève InternalServerErrorException sur erreur Supabase", async () => {
    anonClient.maybeSingle.mockResolvedValueOnce({
      data: null,
      error: { message: "fail" },
    });

    await expect(repository.findById("prod-1")).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );
  });
});
