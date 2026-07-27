import {
  PrestashopProductMapper,
  buildCategoriesCell,
  productCell,
} from "./prestashop-product.mapper";
import { sampleCatalogProduct } from "./prestashop-test.fixtures";

describe("buildCategoriesCell", () => {
  it("retourne la catégorie seule si pas de sous-catégorie", () => {
    const product = sampleCatalogProduct({ category: "Kitesurf", subCategory: null });
    expect(buildCategoriesCell(product)).toBe("Kitesurf");
  });

  it("joint catégorie et sous-catégorie par virgule sans >", () => {
    const product = sampleCatalogProduct({
      category: "Kitesurf",
      subCategory: "Ailes kitesurf",
    });
    expect(buildCategoriesCell(product)).toBe("Kitesurf,Ailes kitesurf");
    expect(buildCategoriesCell(product)).not.toContain(">");
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
    const [row] = mapper.map([product], refs);

    expect(productCell(row, "Actif (0/1)")).toBe("1");
    expect(productCell(row, "Nom *")).toBe('Aile "Pro"');
    expect(productCell(row, "Catégories (x,y,z...)")).toBe("Kitesurf,Ailes");
    expect(productCell(row, "Prix hors taxe")).toBe("1299.5");
    expect(productCell(row, "Référence #")).toBe("SKU-1");
    expect(productCell(row, "Marque")).toBe("Duotone");
    expect(productCell(row, "Description")).toBe(
      '<p>Texte avec "guillemets" et ; point-virgule</p>',
    );
    expect(productCell(row, "Résumé")).toBe("Résumé court");
    expect(productCell(row, "URL des images (x,y,z...)")).toBe("https://cdn.example/a.jpg");
    expect(productCell(row, "État")).toBe("new");
    expect(productCell(row, "ID")).toBe("");
    expect(productCell(row, "EAN13")).toBe("");
  });

  it("met une cellule vide pour une description nulle côté données", () => {
    const product = sampleCatalogProduct({
      description: null as unknown as string,
      detailedDescription: null as unknown as string,
      attributes: { reference: "SKU-N" },
    });
    const refs = new Map([[product.id, "SKU-N"]]);
    const [row] = mapper.map([product], refs);
    expect(productCell(row, "Résumé")).toBe("");
    expect(productCell(row, "Description")).toBe("");
  });
});
