import { NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { ExportService } from "./export.service";
import { CatalogService } from "@/domain/catalog/catalog.service";
import { ProductTemplateService } from "@/domain/product-template/product-template.service";
import { FieldMapperService } from "./mapper/field-mapper.service";
import { AiContentService } from "./mapper/ai-content.service";
import { CsvBuilderService } from "./csv/csv-builder.service";
import type { CatalogProduct } from "@/domain/catalog/types/catalog.types";
import type { ProductTemplate } from "@/domain/product-template/types/product-template.types";
import type { AuthenticatedUser } from "../../core/auth/types/jwt-payload.types";

const user: AuthenticatedUser = {
  id: "550e8400-e29b-41d4-a716-446655440099",
  email: "u@test.com",
  accessToken: "jwt",
};

const catalogProduct = (): CatalogProduct => ({
  id: "550e8400-e29b-41d4-a716-446655440001",
  name: "Lampe",
  brand: "Lux",
  sector: "maison",
  category: "Luminaire",
  subCategory: null,
  year: 2024,
  price: 59,
  description: "LED",
  detailedDescription: "",
  images: [],
  url: "https://x",
  attributes: {},
});

describe("ExportService", () => {
  let service: ExportService;
  const mockCatalog = { findByIds: jest.fn() };
  const mockTemplate = { getTemplateForShop: jest.fn() };
  const mockAi = { generateFields: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        ExportService,
        FieldMapperService,
        CsvBuilderService,
        { provide: CatalogService, useValue: mockCatalog },
        { provide: ProductTemplateService, useValue: mockTemplate },
        { provide: AiContentService, useValue: mockAi },
      ],
    }).compile();

    service = moduleRef.get(ExportService);
  });

  it("lance NotFoundException si le template est absent", async () => {
    mockTemplate.getTemplateForShop.mockResolvedValue(null);
    await expect(
      service.export(
        {
          productIds: [catalogProduct().id],
          templateId: "550e8400-e29b-41d4-a716-446655440002",
          shopId: "550e8400-e29b-41d4-a716-446655440003",
        },
        user,
      ),
    ).rejects.toThrow(NotFoundException);
    expect(mockCatalog.findByIds).not.toHaveBeenCalled();
  });

  it("lance NotFoundException si aucun produit n’est retourné", async () => {
    const tpl: ProductTemplate = {
      id: "550e8400-e29b-41d4-a716-446655440002",
      name: "T",
      shopId: "550e8400-e29b-41d4-a716-446655440003",
      fields: [
        {
          name: "name",
          type: "text",
          required: false,
          order: 0,
        },
      ],
    };
    mockTemplate.getTemplateForShop.mockResolvedValue(tpl);
    mockCatalog.findByIds.mockResolvedValue([]);
    await expect(
      service.export(
        { productIds: [catalogProduct().id], templateId: tpl.id, shopId: tpl.shopId },
        user,
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it("produit un CSV, un nom de fichier sector+date et compte les lignes", async () => {
    const tpl: ProductTemplate = {
      id: "550e8400-e29b-41d4-a716-446655440002",
      name: "T",
      shopId: "550e8400-e29b-41d4-a716-446655440003",
      fields: [
        {
          name: "name",
          type: "text",
          required: false,
          order: 0,
        },
      ],
    };
    mockTemplate.getTemplateForShop.mockResolvedValue(tpl);
    mockCatalog.findByIds.mockResolvedValue([catalogProduct()]);
    mockAi.generateFields.mockResolvedValue([]);

    const result = await service.export(
      { productIds: [catalogProduct().id], templateId: tpl.id, shopId: tpl.shopId },
      user,
    );

    expect(result.csv).toBe("name\nLampe");
    expect(result.rowCount).toBe(1);
    expect(result.filename).toMatch(/^export-maison-\d{4}-\d{2}-\d{2}\.csv$/);
    expect(mockTemplate.getTemplateForShop).toHaveBeenCalledWith(tpl.id, tpl.shopId, user);
    expect(mockCatalog.findByIds).toHaveBeenCalledWith([catalogProduct().id]);
  });
});
