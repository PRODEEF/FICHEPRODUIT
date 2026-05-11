import { NotFoundException } from "@nestjs/common";
import { CatalogService } from "./catalog.service";
import type { ICatalogRepository } from "./catalog.repository.interface";
import type { ShopService } from "../shop/shop.service";
describe("CatalogService", () => {
  const shopId = "550e8400-e29b-41d4-a716-446655440003";
  const user = { id: "550e8400-e29b-41d4-a716-446655440099", email: "u@test.com", accessToken: "t" };

  const sampleShop = (brands: string[]) => ({
    id: shopId,
    name: "Test",
    url: "https://ex.test",
    cms: "prestashop" as const,
    sector: "s",
    brands,
    categories: ["CatA"],
    ownerId: user.id,
    sessionId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const catalogRepoMock: jest.Mocked<Pick<ICatalogRepository, "search" | "findById" | "findByIds">> = {
    search: jest.fn(),
    findById: jest.fn(),
    findByIds: jest.fn(),
  };

  const shopServiceMock = {
    getForUser: jest.fn(),
    getForGuest: jest.fn(),
  } as unknown as jest.Mocked<Pick<ShopService, "getForUser" | "getForGuest">>;

  const service = new CatalogService(catalogRepoMock as unknown as ICatalogRepository, shopServiceMock as unknown as ShopService);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("listCatalogProductsByShopBrands returns [] when shop has no brands", async () => {
    shopServiceMock.getForUser.mockResolvedValue(sampleShop([]));

    const out = await service.listCatalogProductsByShopBrands(shopId, user);

    expect(out).toEqual([]);
    expect(catalogRepoMock.search).not.toHaveBeenCalled();
  });

  it("listCatalogProductsByShopBrands searches by brands only with max limit", async () => {
    shopServiceMock.getForUser.mockResolvedValue(sampleShop(["BrandX", "BrandY"]));
    catalogRepoMock.search.mockResolvedValue([]);

    await service.listCatalogProductsByShopBrands(shopId, user);

    expect(catalogRepoMock.search).toHaveBeenCalledWith({
      brands: ["BrandX", "BrandY"],
      limit: 1000,
    });
  });

  it("listCatalogProductsByShopBrands propagates NotFoundException from shop", async () => {
    shopServiceMock.getForUser.mockRejectedValue(new NotFoundException("Shop not found"));

    await expect(service.listCatalogProductsByShopBrands(shopId, user)).rejects.toThrow(NotFoundException);
    expect(catalogRepoMock.search).not.toHaveBeenCalled();
  });

  it("listCatalogProductsByShopBrandsForGuest returns [] when guest shop has no brands", async () => {
    shopServiceMock.getForGuest.mockResolvedValue({ ...sampleShop([]), ownerId: null, sessionId: "s" });

    const out = await service.listCatalogProductsByShopBrandsForGuest(shopId, "s");

    expect(out).toEqual([]);
    expect(catalogRepoMock.search).not.toHaveBeenCalled();
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
      limit: 1000,
    });
  });
});
