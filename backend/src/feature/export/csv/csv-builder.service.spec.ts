import { CsvBuilderService } from "./csv-builder.service";
import type { MappedProduct } from "../types/export.types";
import type { ExportField } from "../types/export-field.types";

const field = (name: string, overrides: Partial<ExportField> = {}): ExportField => ({
  name,
  type: "text",
  required: false,
  order: 0,
  ...overrides,
});

describe("CsvBuilderService", () => {
  let service: CsvBuilderService;

  beforeEach(() => {
    service = new CsvBuilderService();
  });

  it("construit une ligne d’en-tête et une ligne par produit", () => {
    const exportFields = [field("Nom"), field("Prix")];
    const products: MappedProduct[] = [
      {
        productId: "p1",
        fields: [
          { fieldName: "Nom", value: "Chaise", source: "direct" },
          { fieldName: "Prix", value: "49", source: "direct" },
        ],
      },
    ];
    expect(service.build(products, exportFields)).toBe("Nom,Prix\nChaise,49");
  });

  it("échappe les guillemets et entoure les champs avec métacharactères CSV", () => {
    const exportFields = [field("A")];
    const products: MappedProduct[] = [
      {
        productId: "p1",
        fields: [{ fieldName: "A", value: 'dites "oui"', source: "direct" }],
      },
    ];
    expect(service.build(products, exportFields)).toBe('A\n"dites ""oui"""');
  });

  it("quotes les cellules contenant une virgule ou un saut de ligne", () => {
    const exportFields = [field("Col")];
    const products: MappedProduct[] = [
      { productId: "p1", fields: [{ fieldName: "Col", value: "a,b", source: "direct" }] },
    ];
    expect(service.build(products, exportFields)).toBe('Col\n"a,b"');
  });

  it("utilise une chaîne vide pour une colonne sans valeur mappée", () => {
    const exportFields = [field("X"), field("Y")];
    const products: MappedProduct[] = [
      { productId: "p1", fields: [{ fieldName: "X", value: "un", source: "direct" }] },
    ];
    expect(service.build(products, exportFields)).toBe("X,Y\nun,");
  });
});
