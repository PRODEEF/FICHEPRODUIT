import { BillingPricingService } from "./billing-pricing.service";

describe("BillingPricingService", () => {
  const service = new BillingPricingService();

  it("applique le multiplicateur Vélo ×2 sur STARTER (30 €)", () => {
    expect(service.getCheckoutAmountCents("starter", "Vélo")).toBe(3000);
  });

  it("retourne le nombre de crédits par pack", () => {
    expect(service.getCreditsForPlan("pro")).toBe(20);
    expect(service.getCreditsForPlan("platinum")).toBeNull();
  });

  it("détecte les secteurs au prix de référence (×1) pour STRIPE_PRICE_PLATINUM", () => {
    expect(service.usesReferencePrice("Glisse")).toBe(true);
    expect(service.usesReferencePrice("Montagne")).toBe(true);
    expect(service.usesReferencePrice("Vélo")).toBe(false);
  });
});
