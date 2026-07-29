import type { ShopCategoryNode } from "../../../domain/shop/types/shop-category.types";
import {
  PrestashopProductMapper,
  buildCategoriesCell,
  mapProductCondition,
  productCell,
} from "./prestashop-product.mapper";
import { FICHEPRODUIT_PRESTASHOP_ID_BASE } from "./prestashop-reference";
import { sampleCatalogProduct } from "./prestashop-test.fixtures";

const sampleTree: ShopCategoryNode[] = [
  {
    id: "r1",
    name: "Glisse",
    children: [
      {
        id: "c1",
        name: "Kitesurf",
        children: [{ id: "s1", name: "Ailes", children: [] }],
      },
    ],
  },
];

function idsFor(...products: { id: string }[]): Map<string, string> {
  const map = new Map<string, string>();
  products.forEach((p, index) => {
    map.set(p.id, String(FICHEPRODUIT_PRESTASHOP_ID_BASE + index));
  });
  return map;
}

describe("buildCategoriesCell", () => {
  it("retourne la catégorie fabricant seule si arbre vide et pas de sous-catégorie", () => {
    const product = sampleCatalogProduct({ category: "Kitesurf", subCategory: null });
    expect(buildCategoriesCell(product)).toBe("Kitesurf");
  });

  it("joint catégorie et sous-catégorie par virgule si arbre vide", () => {
    const product = sampleCatalogProduct({
      category: "Kitesurf",
      subCategory: "Ailes kitesurf",
    });
    expect(buildCategoriesCell(product)).toBe("Kitesurf,Ailes kitesurf");
    expect(buildCategoriesCell(product)).not.toContain(">");
  });

  it("retourne un chemin hiérarchique quand l’arbre matche (tokens)", () => {
    const product = sampleCatalogProduct({
      category: "Kitesurf",
      subCategory: "Ailes kitesurf",
    });
    const tree: ShopCategoryNode[] = [
      {
        id: "r1",
        name: "Glisse",
        children: [
          {
            id: "c1",
            name: "Kitesurf",
            children: [{ id: "s1", name: "Ailes de kitesurf", children: [] }],
          },
        ],
      },
    ];
    expect(buildCategoriesCell(product, tree)).toBe("Glisse,Kitesurf,Ailes de kitesurf");
  });
});

describe("mapProductCondition", () => {
  it("conserve les valeurs PrestaShop exactes", () => {
    expect(mapProductCondition("new")).toBe("new");
    expect(mapProductCondition("used")).toBe("used");
    expect(mapProductCondition("refurbished")).toBe("refurbished");
  });

  it("mappe les libellés FR courants", () => {
    expect(mapProductCondition("Neuf")).toBe("new");
    expect(mapProductCondition("occasion")).toBe("used");
    expect(mapProductCondition("Reconditionné")).toBe("refurbished");
  });

  it("retombe sur new si vide ou inconnu", () => {
    expect(mapProductCondition("")).toBe("new");
    expect(mapProductCondition("  ")).toBe("new");
    expect(mapProductCondition("quasi-neuf")).toBe("new");
  });
});

describe("PrestashopProductMapper", () => {
  const mapper = new PrestashopProductMapper();

  it("mappe les champs principaux et laisse les colonnes hors mapping vides", () => {
    const product = sampleCatalogProduct({
      name: 'Aile "Pro"',
      detailedDescription: '<p>Texte avec "guillemets" et ; point-virgule</p>',
      subCategory: "Ailes",
      attributes: { reference: "SKU-1", condition: "new" },
    });
    const refs = new Map([[product.id, "SKU-1"]]);
    const [row] = mapper.map([product], refs, idsFor(product));

    expect(productCell(row, "Actif (0/1)")).toBe("1");
    expect(productCell(row, "Nom *")).toBe('Aile "Pro"');
    expect(productCell(row, "Catégories (x,y,z...)")).toBe("Kitesurf,Ailes");
    expect(productCell(row, "Prix hors taxe")).toBe("1299.5");
    expect(productCell(row, "ID")).toBe(String(FICHEPRODUIT_PRESTASHOP_ID_BASE));
    expect(productCell(row, "Référence #")).toBe("SKU-1");
    expect(productCell(row, "Marque")).toBe("Duotone");
    expect(productCell(row, "Description")).toBe(
      '<p>Texte avec "guillemets" et ; point-virgule</p>',
    );
    expect(productCell(row, "Résumé")).toBe("Résumé court");
    expect(productCell(row, "URL des images (x,y,z...)")).toBe("https://cdn.example/a.jpg");
    expect(productCell(row, "État")).toBe("new");
    expect(productCell(row, "EAN13")).toBe("");
  });

  it("résout les catégories via l’arbre magasin", () => {
    const product = sampleCatalogProduct({
      subCategory: "Ailes",
      attributes: { reference: "SKU-TREE" },
    });
    const refs = new Map([[product.id, "SKU-TREE"]]);
    const [row] = mapper.map([product], refs, idsFor(product), sampleTree);
    expect(productCell(row, "Catégories (x,y,z...)")).toBe("Glisse,Kitesurf,Ailes");
  });

  it("normalise un état FR invalide pour PrestaShop", () => {
    const product = sampleCatalogProduct({
      attributes: { reference: "SKU-2", condition: "Neuf" },
    });
    const refs = new Map([[product.id, "SKU-2"]]);
    const [row] = mapper.map([product], refs, idsFor(product));
    expect(productCell(row, "État")).toBe("new");
  });

  it("utilise un ID numérique FicheProduit indépendant de la référence", () => {
    const product = sampleCatalogProduct({
      attributes: { reference: "44260-3012" },
    });
    const refs = new Map([[product.id, "44260-3012"]]);
    const [row] = mapper.map([product], refs, idsFor(product));
    expect(productCell(row, "ID")).toBe(String(FICHEPRODUIT_PRESTASHOP_ID_BASE));
    expect(productCell(row, "Référence #")).toBe("44260-3012");
  });

  it("met une cellule vide pour une description nulle côté données", () => {
    const product = sampleCatalogProduct({
      description: null as unknown as string,
      detailedDescription: null as unknown as string,
      attributes: { reference: "SKU-N" },
    });
    const refs = new Map([[product.id, "SKU-N"]]);
    const [row] = mapper.map([product], refs, idsFor(product));
    expect(productCell(row, "Résumé")).toBe("");
    expect(productCell(row, "Description")).toBe("");
    expect(productCell(row, "État")).toBe("new");
  });
});
