import { BadRequestException, NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";

import { CatalogService } from "../../../domain/catalog/catalog.service";
import { ShopService } from "../../../domain/shop/shop.service";
import type { AuthenticatedUser } from "../../../core/auth/types/jwt-payload.types";
import { PrestashopCombinationMapper } from "./prestashop-combination.mapper";
import { PrestashopCsvService } from "./prestashop-csv.service";
import { PrestashopExportService } from "./prestashop-export.service";
import { PrestashopProductMapper } from "./prestashop-product.mapper";
import { sampleCatalogProduct } from "./prestashop-test.fixtures";

const user: AuthenticatedUser = {
  id: "550e8400-e29b-41d4-a716-446655440099",
  email: "u@test.com",
  accessToken: "jwt",
};

const shopId = "550e8400-e29b-41d4-a716-446655440003";

describe("PrestashopExportService", () => {
  let service: PrestashopExportService;
  const mockCatalog = { findByIds: jest.fn() };
  const mockShop = { getForUser: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockShop.getForUser.mockResolvedValue({ id: shopId, categoryTree: [] });

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        PrestashopExportService,
        PrestashopProductMapper,
        PrestashopCombinationMapper,
        PrestashopCsvService,
        { provide: CatalogService, useValue: mockCatalog },
        { provide: ShopService, useValue: mockShop },
      ],
    }).compile();

    service = moduleRef.get(PrestashopExportService);
  });

  it("lève NotFoundException si aucun produit", async () => {
    mockCatalog.findByIds.mockResolvedValue([]);
    await expect(
      service.export(
        {
          type: "products",
          shopId,
          productIds: ["550e8400-e29b-41d4-a716-446655440001"],
        },
        user,
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it("lève BadRequestException si référence manquante", async () => {
    const product = sampleCatalogProduct();
    product.attributes = {};
    mockCatalog.findByIds.mockResolvedValue([product]);

    await expect(
      service.export(
        {
          type: "products",
          shopId,
          productIds: [product.id],
        },
        user,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it("retourne un stream products.csv sans appeler la facturation", async () => {
    const product = sampleCatalogProduct();
    mockCatalog.findByIds.mockResolvedValue([product]);

    const result = await service.export(
      {
        type: "products",
        shopId,
        productIds: [product.id],
      },
      user,
    );

    expect(result.filename).toBe("products.csv");
    expect(result.stream).toBeDefined();
    expect(mockShop.getForUser).toHaveBeenCalledWith(shopId, user);
  });

  it("retourne combinations.csv pour type combinations", async () => {
    const product = sampleCatalogProduct({
      attributes: { reference: "R1", taille: "S,M" },
    });
    mockCatalog.findByIds.mockResolvedValue([product]);

    const result = await service.export(
      {
        type: "combinations",
        shopId,
        productIds: [product.id],
      },
      user,
    );

    expect(result.filename).toBe("combinations.csv");
  });
});
