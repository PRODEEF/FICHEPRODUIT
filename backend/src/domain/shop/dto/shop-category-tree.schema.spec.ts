import { parseCategoryTree, shopCategoryTreeSchema } from "./shop-category-tree.schema";

describe("shopCategoryTreeSchema", () => {
  it("accepte un arbre valide", () => {
    const r = shopCategoryTreeSchema.safeParse([
      {
        id: "11111111-1111-4111-8111-111111111111",
        name: "Glisse",
        children: [
          {
            id: "22222222-2222-4222-8222-222222222222",
            name: "Kitesurf",
            children: [],
          },
        ],
      },
    ]);
    expect(r.success).toBe(true);
  });

  it("parseCategoryTree ignore les nœuds invalides", () => {
    const tree = parseCategoryTree([
      { id: "11111111-1111-4111-8111-111111111111", name: "OK", children: [] },
      { id: "", name: "bad", children: [] },
      "not-an-object",
    ]);
    expect(tree).toEqual([
      { id: "11111111-1111-4111-8111-111111111111", name: "OK", children: [] },
    ]);
  });
});
