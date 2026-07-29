import { InternalServerErrorException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { SupabaseService } from "../../core/supabase/supabase.service";
import {
  buildSupabaseQueryMock,
  createSupabaseServiceMock,
} from "../../test-utils/supabase-query.mock";
import { CatalogRepository, CATALOG_FIND_BY_IDS_BATCH_SIZE } from "./catalog.repository";

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

  it("findByIds découpe les requêtes Supabase en lots pour éviter le dépassement d’en-têtes", async () => {
    const makeRow = (id: string) => ({
      id,
      name: `Product ${id}`,
      brand: "Brand",
      sector: "Glisse",
      category: "Surf",
      sub_category: null,
      year: 2024,
      price: 100,
      description: "Desc",
      detailed_description: "",
      images: [],
      url: "https://x.com",
      attributes: {},
    });

    const ids = Array.from(
      { length: CATALOG_FIND_BY_IDS_BATCH_SIZE + 25 },
      (_, index) => `550e8400-e29b-41d4-a716-${String(index).padStart(12, "0")}`,
    );

    const batchesSeen: string[][] = [];
    anonClient.in.mockImplementation((_column: string, batch: string[]) => {
      batchesSeen.push(batch);
      const rows = batch.map((id) => makeRow(id));
      return Promise.resolve({ data: rows, error: null });
    });

    const products = await repository.findByIds(ids);

    expect(batchesSeen).toHaveLength(2);
    expect(batchesSeen[0]).toHaveLength(CATALOG_FIND_BY_IDS_BATCH_SIZE);
    expect(batchesSeen[1]).toHaveLength(25);
    expect(products).toHaveLength(ids.length);
    expect(products[0]?.id).toBe(ids[0]);
    expect(products.at(-1)?.id).toBe(ids.at(-1));
  });
});
