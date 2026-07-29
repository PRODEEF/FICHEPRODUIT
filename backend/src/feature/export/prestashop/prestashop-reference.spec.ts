import {
  MissingProductReferenceError,
  PRESTASHOP_PRODUCT_ID_MAX,
  PRESTASHOP_REFERENCE_MAX_LENGTH,
  FICHEPRODUIT_PRESTASHOP_ID_OFFSET,
  assignPrestashopImportIds,
  disambiguateReference,
  fallbackReferenceFromProductId,
  isUsablePrestashopReference,
  validateProductReferences,
} from "./prestashop-reference";
import { sampleCatalogProduct } from "./prestashop-test.fixtures";

describe("assignPrestashopImportIds", () => {
  it("attribue des IDs numériques stables (même UUID → même ID)", () => {
    const a = sampleCatalogProduct({ id: "550e8400-e29b-41d4-a716-446655440001" });
    const b = sampleCatalogProduct({ id: "550e8400-e29b-41d4-a716-446655440002" });

    const map1 = assignPrestashopImportIds([a, b]);
    const map2 = assignPrestashopImportIds([a, b]);

    expect(map1.get(a.id)).toBe(map2.get(a.id));
    expect(map1.get(b.id)).toBe(map2.get(b.id));
    expect(map1.get(a.id)).toMatch(/^\d+$/);
    expect(map1.get(a.id)).not.toBe(map1.get(b.id));
  });

  it("reste dans la limite PrestaShop INT UNSIGNED (900M–999M)", () => {
    const products = Array.from({ length: 24 }, (_, index) =>
      sampleCatalogProduct({
        id: `550e8400-e29b-41d4-a716-${String(index).padStart(12, "0")}`,
      }),
    );
    const map = assignPrestashopImportIds(products);

    for (const id of map.values()) {
      const numeric = Number(id);
      expect(numeric).toBeGreaterThanOrEqual(FICHEPRODUIT_PRESTASHOP_ID_OFFSET);
      expect(numeric).toBeLessThanOrEqual(PRESTASHOP_PRODUCT_ID_MAX);
    }
  });

  it("produit le même ID quel que soit l'ordre des produits", () => {
    const a = sampleCatalogProduct({ id: "550e8400-e29b-41d4-a716-446655440001" });
    const b = sampleCatalogProduct({ id: "550e8400-e29b-41d4-a716-446655440002" });

    const mapAB = assignPrestashopImportIds([a, b]);
    const mapBA = assignPrestashopImportIds([b, a]);

    expect(mapAB.get(a.id)).toBe(mapBA.get(a.id));
    expect(mapAB.get(b.id)).toBe(mapBA.get(b.id));
  });
});

describe("isUsablePrestashopReference", () => {
  it("rejette les références trop longues ou type dump CMS", () => {
    expect(isUsablePrestashopReference("DUOTSCB")).toBe(true);
    expect(isUsablePrestashopReference("A".repeat(65))).toBe(false);
    expect(isUsablePrestashopReference('{"Choose your region":1}')).toBe(false);
    expect(isUsablePrestashopReference("x,Choose your region,y")).toBe(false);
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
    product.attributes = {};
    expect(() => validateProductReferences([product])).toThrow(MissingProductReferenceError);
  });

  it("échoue si la référence est uniquement des espaces", () => {
    const product = sampleCatalogProduct({ attributes: { reference: "   " } });
    expect(() => validateProductReferences([product])).toThrow(MissingProductReferenceError);
  });

  it("désambiguïse les références dupliquées avec un suffixe d'id produit", () => {
    const a = sampleCatalogProduct({
      id: "550e8400-e29b-41d4-a716-446655440001",
      attributes: { reference: "REF-1" },
    });
    const b = sampleCatalogProduct({
      id: "550e8400-e29b-41d4-a716-446655440002",
      name: "Autre produit",
      attributes: { reference: "REF-1" },
    });
    const map = validateProductReferences([a, b]);
    expect(map.get(a.id)).toBe("REF-1");
    expect(map.get(b.id)).toBe(disambiguateReference("REF-1", b.id));
    expect(map.get(a.id)).not.toBe(map.get(b.id));
  });

  it("remplace une référence dump CMS trop longue par un fallback UUID", () => {
    const product = sampleCatalogProduct({
      id: "550e8400-e29b-41d4-a716-446655440099",
      name: "Kites DUOTONE - Innovation",
      attributes: {
        reference: `","Choose your region","Apply",${"x".repeat(1000)}`,
      },
    });
    const map = validateProductReferences([product]);
    const resolved = map.get(product.id);
    expect(resolved).toBe(fallbackReferenceFromProductId(product.id));
    expect(resolved!.length).toBeLessThanOrEqual(PRESTASHOP_REFERENCE_MAX_LENGTH);
  });
});
