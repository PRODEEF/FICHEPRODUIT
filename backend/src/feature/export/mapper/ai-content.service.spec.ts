import { Test, TestingModule } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";

import { AiContentService } from "./ai-content.service";
import type { CatalogProduct } from "../../../domain/catalog/types/catalog.types";
import type { ExportField } from "../types/export-field.types";

const product = (): CatalogProduct => ({
  id: "550e8400-e29b-41d4-a716-446655440001",
  name: "Objet",
  brand: "B",
  sector: "tech",
  category: "C",
  subCategory: null,
  year: 2025,
  price: 10,
  description: "D",
  detailedDescription: "",
  images: [],
  url: "https://x",
  attributes: {},
});

const field = (name: string): ExportField => ({
  name,
  type: "text",
  required: true,
  order: 0,
});

describe("AiContentService", () => {
  let service: AiContentService;
  let fetchSpy: jest.SpyInstance;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        AiContentService,
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn().mockReturnValue("sk-test"),
            get: jest.fn().mockImplementation((_k: string, def?: string) => def ?? "gpt-4o-mini"),
          },
        },
      ],
    }).compile();

    service = moduleRef.get(AiContentService);
    fetchSpy = jest.spyOn(global, "fetch");
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it("retourne [] si aucun champ à générer", async () => {
    const result = await service.generateFields(product(), []);
    expect(result).toEqual([]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("parse la réponse JSON OpenAI et aligne les valeurs sur les noms de champs", async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: '{"Accroche":"Hello"}' } }],
      }),
    } as Response);

    const result = await service.generateFields(product(), [field("Accroche")]);
    expect(result).toEqual([{ fieldName: "Accroche", value: "Hello", source: "ai" }]);
  });

  it("retourne des valeurs vides si l’API échoue", async () => {
    fetchSpy.mockResolvedValue({ ok: false, status: 500 } as Response);
    const result = await service.generateFields(product(), [field("A"), field("B")]);
    expect(result).toEqual([
      { fieldName: "A", value: "", source: "ai" },
      { fieldName: "B", value: "", source: "ai" },
    ]);
  });
});
