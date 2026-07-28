import {
  DuplicateProductReferenceError,
  MissingProductReferenceError,
  toPrestashopImportId,
  validateProductReferences,
} from "./prestashop-reference";
import { sampleCatalogProduct } from "./prestashop-test.fixtures";

describe("toPrestashopImportId", () => {
  it("retire tous les tirets de la référence", () => {
    expect(toPrestashopImportId("44260-3012")).toBe("442603012");
    expect(toPrestashopImportId("REF-B")).toBe("REFB");
    expect(toPrestashopImportId("ABC")).toBe("ABC");
  });
});

describe("validateProductReferences", () => {
  it("retourne la map productId → référence", () => {
    const product = sampleCatalogProduct();
    const map = validateProductReferences([product]);
    expect(map.get(product.id)).toBe("44260-3012");
  });

  it("échoue si la référence est manquante", () => {
    const product = sampleCatalogProduct({ attributes: { reference: "" } });
    // sample merges reference: "" over default — need to clear
    product.attributes = {};
    expect(() => validateProductReferences([product])).toThrow(MissingProductReferenceError);
  });

  it("échoue si la référence est uniquement des espaces", () => {
    const product = sampleCatalogProduct({ attributes: { reference: "   " } });
    expect(() => validateProductReferences([product])).toThrow(MissingProductReferenceError);
  });

  it("échoue si la référence est dupliquée", () => {
    const a = sampleCatalogProduct({
      id: "550e8400-e29b-41d4-a716-446655440001",
      attributes: { reference: "REF-1" },
    });
    const b = sampleCatalogProduct({
      id: "550e8400-e29b-41d4-a716-446655440002",
      attributes: { reference: "REF-1" },
    });
    expect(() => validateProductReferences([a, b])).toThrow(DuplicateProductReferenceError);
  });
});
