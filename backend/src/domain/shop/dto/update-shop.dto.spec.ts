import { updateShopSchema } from "./update-shop.dto";

describe("updateShopSchema brands/categories", () => {
  it("accepte des marques et catégories valides", () => {
    const r = updateShopSchema.safeParse({
      brands: ["Nike", "Adidas"],
      categories: ["Vélos"],
    });
    expect(r.success).toBe(true);
  });

  it("rejette une marque de plus de 64 caractères", () => {
    const r = updateShopSchema.safeParse({
      brands: ["a".repeat(65)],
    });
    expect(r.success).toBe(false);
  });

  it("rejette une catégorie vide après trim", () => {
    const r = updateShopSchema.safeParse({
      categories: ["   "],
    });
    expect(r.success).toBe(false);
  });
});
