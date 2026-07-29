import { updateShopSchema } from "./update-shop.dto";

const validNode = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "Vélos",
  children: [],
};

describe("updateShopSchema brands/categoryTree", () => {
  it("accepte des marques et un arbre de catégories valide", () => {
    const r = updateShopSchema.safeParse({
      brands: ["Nike", "Adidas"],
      categoryTree: [validNode],
    });
    expect(r.success).toBe(true);
  });

  it("rejette une marque de plus de 64 caractères", () => {
    const r = updateShopSchema.safeParse({
      brands: ["a".repeat(65)],
    });
    expect(r.success).toBe(false);
  });

  it("rejette un nœud avec nom vide après trim", () => {
    const r = updateShopSchema.safeParse({
      categoryTree: [{ ...validNode, name: "   " }],
    });
    expect(r.success).toBe(false);
  });

  it("rejette une profondeur supérieure à 5", () => {
    const deep = {
      id: "11111111-1111-4111-8111-111111111111",
      name: "L1",
      children: [
        {
          id: "22222222-2222-4222-8222-222222222222",
          name: "L2",
          children: [
            {
              id: "33333333-3333-4333-8333-333333333333",
              name: "L3",
              children: [
                {
                  id: "44444444-4444-4444-8444-444444444444",
                  name: "L4",
                  children: [
                    {
                      id: "55555555-5555-4555-8555-555555555555",
                      name: "L5",
                      children: [
                        {
                          id: "66666666-6666-4666-8666-666666666666",
                          name: "L6",
                          children: [],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };
    const r = updateShopSchema.safeParse({ categoryTree: [deep] });
    expect(r.success).toBe(false);
  });
});
