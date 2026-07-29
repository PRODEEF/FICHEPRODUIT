import type { CatalogProduct } from "../../../domain/catalog/types/catalog.types";

/** Produit catalogue minimal pour les tests d’export PrestaShop. */
export function sampleCatalogProduct(
  overrides: Partial<CatalogProduct> & {
    attributes?: Record<string, string>;
  } = {},
): CatalogProduct {
  const { attributes: attrOverrides, ...rest } = overrides;
  return {
    id: "550e8400-e29b-41d4-a716-446655440001",
    name: "Aile Rebel",
    brand: "Duotone",
    sector: "Glisse",
    category: "Kitesurf",
    subCategory: null,
    year: 2024,
    price: 1299.5,
    description: "Résumé court",
    detailedDescription: "<p>Description</p>",
    images: ["https://cdn.example/a.jpg"],
    url: "https://example.com/p",
    attributes: {
      reference: "44260-3012",
      ...attrOverrides,
    },
    ...rest,
  };
}
