import { ConfigService } from "@nestjs/config";
import { RefineFieldsService } from "./refine-fields.service";
import type { ProductTemplateField } from "../types/product-template.types";

const baseFields: ProductTemplateField[] = [
  { name: "Nom du produit", type: "text", required: false, order: 0 },
  { name: "Couleur :", type: "text", required: false, order: 1 },
];

describe("RefineFieldsService", () => {
  let service: RefineFieldsService;
  let configGet: jest.Mock;

  beforeEach(() => {
    configGet = jest.fn();
    const config = { get: configGet } as unknown as ConfigService;
    service = new RefineFieldsService(config);
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("retourne refinedWithAi false si la clé OpenAI est absente", async () => {
    configGet.mockReturnValue("");

    const result = await service.refine(baseFields, "product_page");

    expect(result.refinedWithAi).toBe(false);
    expect(result.fields).toEqual(baseFields);
    expect(result.message).toMatch(/Clé OpenAI/i);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("retourne refinedWithAi false si l’API échoue", async () => {
    configGet.mockImplementation((key: string, defaultValue?: string) => {
      if (key === "openaiApiKey") return "sk-test";
      if (key === "openaiModel") return defaultValue;
      return defaultValue;
    });
    jest.mocked(global.fetch).mockResolvedValue({ ok: false } as Response);

    const result = await service.refine(baseFields, "manual");

    expect(result.refinedWithAi).toBe(false);
    expect(result.fields).toEqual(baseFields);
    expect(result.message).toMatch(/indisponible/i);
  });

  it("affine les champs et normalise html → rich_text", async () => {
    configGet.mockImplementation((key: string, defaultValue?: string) => {
      if (key === "openaiApiKey") return "sk-test";
      if (key === "openaiModel") return "gpt-4o-mini";
      return defaultValue;
    });
    jest.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                fields: [
                  { name: "Nom du produit", type: "text", required: true },
                  { name: "Couleur", type: "color", required: false },
                ],
              }),
            },
          },
        ],
      }),
    } as Response);

    const result = await service.refine(baseFields, "product_page", { Couleur: "Noir" });

    expect(result.refinedWithAi).toBe(true);
    expect(result.message).toMatch(/affinés/i);
    expect(result.fields[0]?.required).toBe(true);
    expect(result.fields[1]?.name).toBe("Couleur");
    expect(result.fields[1]?.type).toBe("color");
  });

  it("rejette une réponse dont le nombre de champs diffère", async () => {
    configGet.mockImplementation((key: string, defaultValue?: string) => {
      if (key === "openaiApiKey") return "sk-test";
      return defaultValue;
    });
    jest.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                fields: [{ name: "Seul", type: "text", required: false }],
              }),
            },
          },
        ],
      }),
    } as Response);

    const result = await service.refine(baseFields, "manual");

    expect(result.refinedWithAi).toBe(false);
    expect(result.fields).toEqual(baseFields);
    expect(result.message).toMatch(/nombre de champs/i);
  });
});
