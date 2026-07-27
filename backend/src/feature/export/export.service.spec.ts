import { NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";

import { ExportService } from "./export.service";
import { CatalogService } from "../../domain/catalog/catalog.service";
import { CreditService } from "../../domain/billing/credit.service";
import { InsufficientCreditsException } from "../../domain/billing/exceptions/insufficient-credits.exception";
import { FieldMapperService } from "./mapper/field-mapper.service";
import { AiContentService } from "./mapper/ai-content.service";
import { CsvBuilderService } from "./csv/csv-builder.service";
import type { CatalogProduct } from "../../domain/catalog/types/catalog.types";
import type { AuthenticatedUser } from "../../core/auth/types/jwt-payload.types";
import { DEFAULT_EXPORT_FIELDS } from "./types/export-field.types";

const user: AuthenticatedUser = {
  id: "550e8400-e29b-41d4-a716-446655440099",
  email: "u@test.com",
  accessToken: "jwt",
};

const shopId = "550e8400-e29b-41d4-a716-446655440003";

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
  const mockAi = { generateFields: jest.fn() };
  const mockCredit = {
    reserveCreditsForExport: jest.fn(),
    refundExportReservation: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        ExportService,
        FieldMapperService,
        CsvBuilderService,
        { provide: CatalogService, useValue: mockCatalog },
        { provide: CreditService, useValue: mockCredit },
        { provide: AiContentService, useValue: mockAi },
      ],
    }).compile();

    service = moduleRef.get(ExportService);
  });

  it("lance NotFoundException si aucun produit n’est retourné", async () => {
    mockCatalog.findByIds.mockResolvedValue([]);
    await expect(
      service.export({ productIds: [catalogProduct().id], shopId }, user),
    ).rejects.toThrow(NotFoundException);
  });

  it("produit un CSV avec les colonnes par défaut, un nom de fichier sector+date et compte les lignes", async () => {
    mockCatalog.findByIds.mockResolvedValue([catalogProduct()]);
    mockAi.generateFields.mockResolvedValue([]);
    mockCredit.reserveCreditsForExport.mockResolvedValue("attempt-1");

    const result = await service.export({ productIds: [catalogProduct().id], shopId }, user);

    const expectedHeader = DEFAULT_EXPORT_FIELDS.map((f) => f.name).join(",");
    expect(result.csv.startsWith(expectedHeader + "\n")).toBe(true);
    expect(result.csv).toContain("Lampe");
    expect(result.csv).toContain("Lux");
    expect(result.csv).toContain("59");
    expect(result.rowCount).toBe(1);
    expect(result.filename).toMatch(/^export-maison-\d{4}-\d{2}-\d{2}\.csv$/);
    expect(mockCatalog.findByIds).toHaveBeenCalledWith([catalogProduct().id]);
    expect(mockCredit.reserveCreditsForExport).toHaveBeenCalled();
  });

  it("lève InsufficientCreditsException si le solde est insuffisant", async () => {
    mockCatalog.findByIds.mockResolvedValue([catalogProduct()]);
    mockCredit.reserveCreditsForExport.mockRejectedValue(new InsufficientCreditsException(2, 1));

    await expect(
      service.export({ productIds: [catalogProduct().id], shopId }, user),
    ).rejects.toThrow(InsufficientCreditsException);

    expect(mockCredit.refundExportReservation).not.toHaveBeenCalled();
  });

  it("rembourse les crédits si le mapping IA échoue après réservation", async () => {
    mockCatalog.findByIds.mockResolvedValue([catalogProduct()]);
    mockCredit.reserveCreditsForExport.mockResolvedValue("attempt-refund");
    mockAi.generateFields.mockRejectedValue(new Error("Échec IA"));

    await expect(
      service.export({ productIds: [catalogProduct().id], shopId }, user),
    ).rejects.toThrow("Échec IA");

    expect(mockCredit.refundExportReservation).toHaveBeenCalledWith(user.id, "attempt-refund");
  });
});
