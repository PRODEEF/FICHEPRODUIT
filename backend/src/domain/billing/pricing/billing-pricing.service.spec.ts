import { BillingPricingService } from "./billing-pricing.service";

describe("BillingPricingService", () => {
  const service = new BillingPricingService();

  it("applique le multiplicateur Vélo ×2 sur STARTER (30 €)", () => {
    expect(service.getCheckoutAmountCents("starter", "Vélo")).toBe(3000);
  });

  it("retourne le nombre de crédits par pack", () => {
    expect(service.getCreditsForPlan("pro")).toBe(10);
    expect(service.getCreditsForPlan("platinum")).toBeNull();
  });

  it("détecte les secteurs au prix de référence (×1) pour STRIPE_PRICE_PLATINUM", () => {
    expect(service.usesReferencePrice("Glisse")).toBe(true);
    expect(service.usesReferencePrice("Montagne")).toBe(true);
    expect(service.usesReferencePrice("Vélo")).toBe(false);
  });

  it("retourne les forfaits publics pour un secteur", () => {
    const result = service.getPublicPlansForSector("Mode");

    expect(result.multiplier).toBe(0.7);
    expect(result.plans).toHaveLength(5);
    expect(result.plans.find((p) => p.id === "starter")?.priceEur).toBe(10.5);
  });

  it("expose le libellé Pro avec 10 crédits", () => {
    const result = service.getPublicPlansForSector("Glisse");
    const pro = result.plans.find((p) => p.id === "pro");

    expect(pro?.creditsLabel).toBe("10 crédits");
    expect(pro?.name).toBe("PRO");
  });

  it("expose business_custom sous le nom BUSINESS CUSTOM", () => {
    const result = service.getPublicPlansForSector("Glisse");
    const custom = result.plans.find((p) => p.id === "business_custom");

    expect(custom?.name).toBe("BUSINESS CUSTOM");
  });
});
