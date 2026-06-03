import { NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import {
  PRODUCT_TEMPLATE_REPOSITORY,
  type IProductTemplateRepository,
} from "./product-template.repository.interface";
import { ProductTemplateService } from "./product-template.service";
import { ShopService } from "../shop/shop.service";
import { ScrapeFieldsService } from "./sub-services/scrape-fields.service";
import { RefineFieldsService } from "./sub-services/refine-fields.service";

describe("ProductTemplateService", () => {
  let service: ProductTemplateService;
  const templateRepo: jest.Mocked<IProductTemplateRepository> = {
    findById: jest.fn(),
    findAllByShop: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
  const shopService = { getForUser: jest.fn() };
  const scrapeFields = { scrape: jest.fn() };
  const refineFields = { refine: jest.fn() };

  const user = { id: "user-1", email: "a@b.com", accessToken: "tok" };
  const shopId = "shop-1";

  beforeEach(async () => {
    jest.clearAllMocks();
    shopService.getForUser.mockResolvedValue({
      id: shopId,
      name: "Shop",
      url: "https://x.com",
      cms: "prestashop",
      sector: null,
      brands: [],
      categories: [],
      ownerId: "user-1",
      createdAt: "",
      updatedAt: "",
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductTemplateService,
        { provide: PRODUCT_TEMPLATE_REPOSITORY, useValue: templateRepo },
        { provide: ShopService, useValue: shopService },
        { provide: ScrapeFieldsService, useValue: scrapeFields },
        { provide: RefineFieldsService, useValue: refineFields },
      ],
    }).compile();

    service = module.get(ProductTemplateService);
  });

  it("getOneInShop vérifie le shop puis le gabarit", async () => {
    templateRepo.findById.mockResolvedValue({
      id: "tpl-1",
      name: "Gabarit",
      shopId,
      fields: [],
    });

    const tpl = await service.getOneInShop(shopId, "tpl-1", user);

    expect(shopService.getForUser).toHaveBeenCalledWith(shopId, user);
    expect(tpl.id).toBe("tpl-1");
  });

  it("getOneInShop lève NotFoundException si le gabarit est sur un autre shop", async () => {
    templateRepo.findById.mockResolvedValue({
      id: "tpl-1",
      name: "Gabarit",
      shopId: "other-shop",
      fields: [],
    });

    await expect(service.getOneInShop(shopId, "tpl-1", user)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it("scrapeFromUrl exige l'accès au shop", async () => {
    scrapeFields.scrape.mockResolvedValue({ fields: [], sampleValues: {}, warnings: [] });

    await service.scrapeFromUrl(shopId, user, "https://product.test");

    expect(shopService.getForUser).toHaveBeenCalledWith(shopId, user);
    expect(scrapeFields.scrape).toHaveBeenCalledWith("https://product.test");
  });

  it("refineWithAi exige l'accès au shop", async () => {
    refineFields.refine.mockResolvedValue({ fields: [], refinedWithAi: false });

    await service.refineWithAi(
      shopId,
      user,
      [{ name: "Nom", type: "text", required: true }],
      "manual",
    );

    expect(shopService.getForUser).toHaveBeenCalledWith(shopId, user);
    expect(refineFields.refine).toHaveBeenCalled();
  });
});
