import type { ShopCategoryNode } from "../../../domain/shop/types/shop-category.types";
import {
  autoMatchCategoryNode,
  buildCategoryBreadcrumb,
  buildCategoryMappingKey,
  buildManufacturerCategoriesCell,
  flattenCategoryTree,
  normalizeCategoryLabel,
  resolveExportCategory,
  resolveExportCategoryPath,
} from "./category-tree-matcher";
import { sampleCatalogProduct } from "./prestashop-test.fixtures";

function node(id: string, name: string, children: ShopCategoryNode[] = []): ShopCategoryNode {
  return { id, name, children };
}

const sampleTree: ShopCategoryNode[] = [
  node("r1", "Glisse", [
    node("c1", "Kitesurf", [node("s1", "Ailes de kitesurf"), node("s2", "Planches")]),
    node("c2", "Surf", [node("s3", "Planches")]),
  ]),
  node("r2", "Textile", [node("c3", "T-shirts")]),
];

describe("flattenCategoryTree", () => {
  it("produit un chemin de noms pour chaque nœud", () => {
    const flat = flattenCategoryTree(sampleTree);
    expect(flat).toHaveLength(8);
    const ailes = flat.find((e) => e.node.id === "s1");
    expect(ailes?.pathNames).toEqual(["Glisse", "Kitesurf", "Ailes de kitesurf"]);
    expect(ailes?.depth).toBe(3);
  });
});

describe("buildCategoryBreadcrumb", () => {
  it("joint avec des virgules (format import PrestaShop)", () => {
    expect(buildCategoryBreadcrumb(["Glisse", "Kitesurf", "Ailes"])).toBe("Glisse,Kitesurf,Ailes");
  });
});

describe("normalizeCategoryLabel", () => {
  it("normalise casse, accents et espaces", () => {
    expect(normalizeCategoryLabel("  Ailes Kitesurf  ")).toBe("ailes kitesurf");
    expect(normalizeCategoryLabel("Été")).toBe("ete");
  });
});

describe("buildManufacturerCategoriesCell", () => {
  it("joint catégorie et sous-catégorie par virgule", () => {
    const product = sampleCatalogProduct({
      category: "Kitesurf",
      subCategory: "Ailes kitesurf",
    });
    expect(buildManufacturerCategoriesCell(product)).toBe("Kitesurf,Ailes kitesurf");
  });
});

describe("autoMatchCategoryNode", () => {
  it("match token : Ailes kitesurf → Ailes de kitesurf", () => {
    const matched = autoMatchCategoryNode("Kitesurf", "Ailes kitesurf", sampleTree);
    expect(matched?.node.id).toBe("s1");
    expect(matched?.pathNames).toEqual(["Glisse", "Kitesurf", "Ailes de kitesurf"]);
  });

  it("match exact sur catégorie si pas de sous-catégorie", () => {
    const matched = autoMatchCategoryNode("Kitesurf", null, sampleTree);
    expect(matched?.node.id).toBe("c1");
  });

  it("préféré le nœud le plus profond aligné sur la catégorie", () => {
    const matched = autoMatchCategoryNode("Surf", "Planches", sampleTree);
    expect(matched?.node.id).toBe("s3");
    expect(matched?.pathNames).toEqual(["Glisse", "Surf", "Planches"]);
  });

  it("ne matche pas un faux positif partiel (Surf ≠ Surface)", () => {
    const tree = [node("x1", "Surface", [])];
    expect(autoMatchCategoryNode("Surf", null, tree)).toBeNull();
  });

  it("retourne null si aucun match", () => {
    expect(autoMatchCategoryNode("Inconnu", "Rien", sampleTree)).toBeNull();
  });

  it("retourne null si arbre vide", () => {
    expect(autoMatchCategoryNode("Kitesurf", null, [])).toBeNull();
  });
});

describe("resolveExportCategoryPath", () => {
  it("retourne le breadcrumb auto-matché (virgules)", () => {
    const product = sampleCatalogProduct({
      category: "Kitesurf",
      subCategory: "Ailes kitesurf",
    });
    expect(resolveExportCategoryPath(product, sampleTree)).toBe(
      "Glisse,Kitesurf,Ailes de kitesurf",
    );
  });

  it("repli fabricant si pas de match (pas de racine forcée)", () => {
    const product = sampleCatalogProduct({
      category: "Inconnu",
      subCategory: "Rien",
    });
    expect(resolveExportCategoryPath(product, sampleTree)).toBe("Inconnu,Rien");
  });

  it("repli fabricant si arbre vide", () => {
    const product = sampleCatalogProduct({
      category: "Kitesurf",
      subCategory: "Ailes kitesurf",
    });
    expect(resolveExportCategoryPath(product, [])).toBe("Kitesurf,Ailes kitesurf");
    expect(resolveExportCategoryPath(product, [])).not.toContain(">");
  });

  it("applique un override manuel par sourceKey", () => {
    const product = sampleCatalogProduct({
      category: "Kitesurf",
      subCategory: "Ailes kitesurf",
    });
    const key = buildCategoryMappingKey("Kitesurf", "Ailes kitesurf");
    const overrides = new Map([[key, "c3"]]);
    expect(resolveExportCategoryPath(product, sampleTree, overrides)).toBe("Textile,T-shirts");
  });

  it("override vide force le repli fabricant", () => {
    const product = sampleCatalogProduct({
      category: "Kitesurf",
      subCategory: "Ailes kitesurf",
    });
    const key = buildCategoryMappingKey("Kitesurf", "Ailes kitesurf");
    const overrides = new Map([[key, ""]]);
    expect(resolveExportCategory(product, sampleTree, overrides)).toEqual({
      path: "Kitesurf,Ailes kitesurf",
      matchedNodeId: null,
      matchKind: "none",
    });
  });
});
