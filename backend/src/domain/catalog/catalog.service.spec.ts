import { NotFoundException } from "@nestjs/common";
import { CATALOG_SEARCH_MAX_LIMIT } from "./catalog.constants";
import { CatalogService } from "./catalog.service";
import type { ICatalogRepository } from "./catalog.repository.interface";
import type { ShopService } from "../shop/shop.service";
describe("CatalogService", () => {
  const shopId = "550e8400-e29b-41d4-a716-446655440003";
  const user = {
    id: "550e8400-e29b-41d4-a716-446655440099",
    email: "u@test.com",
    accessToken: "t",
    emailConfirmedAt: "2026-08-01T10:00:00Z",
  };

  const sampleShop = (brands: string[]) => ({
    id: shopId,
    name: "Test",
    url: "https://ex.test",
    cms: "prestashop" as const,
    sector: "s",
    brands,
    categories: ["CatA"],
    categoryTree: [],
    ownerId: user.id,
    sessionId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const catalogRepoMock: jest.Mocked<
    Pick<ICatalogRepository, "search" | "findById" | "findByIds" | "listDistinctBrandsBySector">
  > = {
    search: jest.fn(),
    findById: jest.fn(),
    findByIds: jest.fn(),
    listDistinctBrandsBySector: jest.fn(),
  };

  const shopServiceMock = {
    getForUser: jest.fn(),
    getForGuest: jest.fn(),
  } as unknown as jest.Mocked<Pick<ShopService, "getForUser" | "getForGuest">>;

  const service = new CatalogService(
    catalogRepoMock as unknown as ICatalogRepository,
    shopServiceMock as unknown as ShopService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("listCatalogProductsByShopBrands returns global catalog when shop has no brands", async () => {
    shopServiceMock.getForUser.mockResolvedValue(sampleShop([]));
    catalogRepoMock.search.mockResolvedValue([]);

    const out = await service.listCatalogProductsByShopBrands(shopId, user);

    expect(out).toEqual([]);
    expect(catalogRepoMock.search).toHaveBeenCalledWith({ limit: CATALOG_SEARCH_MAX_LIMIT });
  });

  it("listCatalogProductsByShopBrands searches by brands only with max limit", async () => {
    shopServiceMock.getForUser.mockResolvedValue(sampleShop(["BrandX", "BrandY"]));
    catalogRepoMock.search.mockResolvedValue([]);

    await service.listCatalogProductsByShopBrands(shopId, user);

    expect(catalogRepoMock.search).toHaveBeenCalledWith({
      brands: ["BrandX", "BrandY"],
      limit: CATALOG_SEARCH_MAX_LIMIT,
    });
  });

  it("listCatalogProductsByShopBrands propagates NotFoundException from shop", async () => {
    shopServiceMock.getForUser.mockRejectedValue(new NotFoundException("Shop not found"));

    await expect(service.listCatalogProductsByShopBrands(shopId, user)).rejects.toThrow(
      NotFoundException,
    );
    expect(catalogRepoMock.search).not.toHaveBeenCalled();
  });

  it("listCatalogProductsByShopBrandsForGuest returns global catalog when guest shop has no brands", async () => {
    shopServiceMock.getForGuest.mockResolvedValue({
      ...sampleShop([]),
      ownerId: null,
      sessionId: "s",
    });
    catalogRepoMock.search.mockResolvedValue([]);

    const out = await service.listCatalogProductsByShopBrandsForGuest(shopId, "s");

    expect(out).toEqual([]);
    expect(catalogRepoMock.search).toHaveBeenCalledWith({ limit: CATALOG_SEARCH_MAX_LIMIT });
  });

  it("listCatalogProductsByShopBrandsForGuest searches by brands with max limit", async () => {
    shopServiceMock.getForGuest.mockResolvedValue({
      ...sampleShop(["G"]),
      ownerId: null,
      sessionId: "s",
    });
    catalogRepoMock.search.mockResolvedValue([]);

    await service.listCatalogProductsByShopBrandsForGuest(shopId, "s");

    expect(catalogRepoMock.search).toHaveBeenCalledWith({
      brands: ["G"],
      limit: CATALOG_SEARCH_MAX_LIMIT,
    });
  });

  it("listBrandsBySector délègue au repository avec plafond 50", async () => {
    catalogRepoMock.listDistinctBrandsBySector.mockResolvedValue(["A", "B"]);

    const out = await service.listBrandsBySector(" Glisse ");

    expect(out).toEqual(["A", "B"]);
    expect(catalogRepoMock.listDistinctBrandsBySector).toHaveBeenCalledWith("Glisse", 50);
  });

  it("listBrandsBySector retourne [] si secteur vide", async () => {
    const out = await service.listBrandsBySector("   ");
    expect(out).toEqual([]);
    expect(catalogRepoMock.listDistinctBrandsBySector).not.toHaveBeenCalled();
  });
});
