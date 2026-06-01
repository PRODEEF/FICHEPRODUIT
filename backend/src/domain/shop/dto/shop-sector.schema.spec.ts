import { normalizeShopSector } from "./shop-sector.schema";
import { updateShopSchema } from "./update-shop.dto";

describe("shop-sector.schema", () => {
  describe("normalizeShopSector", () => {
    it("retourne le label canonique si valide", () => {
      expect(normalizeShopSector("Glisse")).toBe("Glisse");
    });

    it("retourne null pour une valeur hors liste", () => {
      expect(normalizeShopSector("Kitesurf")).toBeNull();
    });

    it("retourne null pour null, undefined ou chaîne vide", () => {
      expect(normalizeShopSector(null)).toBeNull();
      expect(normalizeShopSector(undefined)).toBeNull();
      expect(normalizeShopSector("  ")).toBeNull();
    });
  });
});

describe("updateShopSchema sector", () => {
  it("accepte un secteur valide", () => {
    const r = updateShopSchema.safeParse({ sector: "Vélo" });
    expect(r.success).toBe(true);
  });

  it("accepte sector null", () => {
    const r = updateShopSchema.safeParse({ sector: null });
    expect(r.success).toBe(true);
  });

  it("rejette Kitesurf", () => {
    const r = updateShopSchema.safeParse({ sector: "Kitesurf" });
    expect(r.success).toBe(false);
  });

  it("accepte Glisse", () => {
    const r = updateShopSchema.safeParse({ sector: "Glisse" });
    expect(r.success).toBe(true);
  });
});
