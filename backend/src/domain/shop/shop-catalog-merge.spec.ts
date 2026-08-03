import { mergeShopBrands, mergeShopCategoryTrees } from "./shop-catalog-merge";
import type { ShopCategoryNode } from "./types/shop-category.types";

describe("mergeShopBrands", () => {
  it("ajoute les marques détectées sans écraser les existantes", () => {
    expect(mergeShopBrands(["Nike"], ["Adidas", "Nike"])).toEqual(["Nike", "Adidas"]);
  });

  it("déduplique sans tenir compte de la casse", () => {
    expect(mergeShopBrands(["nike"], ["NIKE", "Puma"])).toEqual(["nike", "Puma"]);
  });

  it("ignore les chaînes vides", () => {
    expect(mergeShopBrands(["A", "  "], ["", "B"])).toEqual(["A", "B"]);
  });
});

describe("mergeShopCategoryTrees", () => {
  const node = (id: string, name: string, children: ShopCategoryNode[] = []): ShopCategoryNode => ({
    id,
    name,
    children,
  });

  it("conserve les catégories existantes et ajoute les nouvelles", () => {
    const existing = [node("c1", "Chaussures")];
    const detected = [node("c2", "Autre"), node("c3", "Chaussures")];

    const merged = mergeShopCategoryTrees(existing, detected);

    expect(merged.map((n) => n.name)).toEqual(["Chaussures", "Autre"]);
    expect(merged[0]?.id).toBe("c1");
  });

  it("fusionne récursivement les enfants sous un même parent", () => {
    const existing = [node("p1", "Sport", [node("c1", "Running")])];
    const detected = [node("p2", "Sport", [node("c2", "Fitness"), node("c3", "running")])];

    const merged = mergeShopCategoryTrees(existing, detected);
    const sport = merged[0];

    expect(sport?.id).toBe("p1");
    expect(sport?.children.map((c) => c.name)).toEqual(["Running", "Fitness"]);
    expect(sport?.children[0]?.id).toBe("c1");
  });
});
