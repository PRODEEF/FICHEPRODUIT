import { BadRequestException, Injectable } from "@nestjs/common";
import type { ShopSector } from "../../shop/dto/shop-sector.schema";
import type { BillingPlanId } from "../types/billing.types";

/** Crédits inclus par pack (hors abonnement Platinium). */
export const PLAN_CREDIT_AMOUNTS: Record<Exclude<BillingPlanId, "platinum">, number> = {
  starter: 1,
  pro: 20,
  business_silver: 100,
  business_gold: 500,
};

/** Prix de référence TTC en euros — secteur Glisse (×1,0). */
const REFERENCE_PLAN_PRICES_EUR: Record<BillingPlanId, number> = {
  starter: 15,
  pro: 200,
  business_silver: 800,
  business_gold: 2500,
  platinum: 499.9,
};

/**
 * Multiplicateurs tarifaires par secteur — miroir de `frontend/.../pricingConfig.ts`.
 */
const SECTOR_PRICE_MULTIPLIERS: Record<ShopSector, number> = {
  Vélo: 2,
  Nautisme: 1.3,
  Gaming: 1.3,
  Outdoor: 1.2,
  Glisse: 1,
  Sport: 0.9,
  Maison: 0.8,
  Mode: 0.7,
  Gastronomie: 0.6,
  Montagne: 1,
  Animalerie: 1,
  Jardin: 1,
  Bricolage: 1,
  Puériculture: 1,
  Bijoux: 1,
  Montres: 1,
};

const PACK_PLANS_WITH_FREE_LOW_PRICE: ReadonlySet<Exclude<BillingPlanId, "platinum">> = new Set([
  "business_silver",
  "business_gold",
]);

@Injectable()
export class BillingPricingService {
  getSectorMultiplier(sector: ShopSector): number {
    return SECTOR_PRICE_MULTIPLIERS[sector];
  }

  /**
   * Secteurs au multiplicateur ×1 — compatibles avec un Price ID Stripe fixe (montant = référence Glisse).
   */
  usesReferencePrice(sector: ShopSector): boolean {
    return this.getSectorMultiplier(sector) === 1;
  }

  /** Montant TTC en centimes pour Stripe Checkout. */
  getCheckoutAmountCents(planId: BillingPlanId, sector: ShopSector): number {
    const baseEur = REFERENCE_PLAN_PRICES_EUR[planId];
    const multiplier = this.getSectorMultiplier(sector);
    const amountEur = Math.round(baseEur * multiplier * 100) / 100;
    return Math.round(amountEur * 100);
  }

  getCreditsForPlan(planId: BillingPlanId): number | null {
    if (planId === "platinum") return null;
    return PLAN_CREDIT_AMOUNTS[planId];
  }

  planGrantsFreeLowPriceExports(planId: BillingPlanId): boolean {
    if (planId === "platinum") return true;
    return PACK_PLANS_WITH_FREE_LOW_PRICE.has(planId);
  }

  getPlanDisplayName(planId: BillingPlanId): string {
    const names: Record<BillingPlanId, string> = {
      starter: "STARTER",
      pro: "PRO",
      business_silver: "BUSINESS SILVER",
      business_gold: "BUSINESS GOLD",
      platinum: "PLATINIUM",
    };
    return names[planId];
  }

  assertPackPlan(planId: BillingPlanId): Exclude<BillingPlanId, "platinum"> | "platinum" {
    const valid: BillingPlanId[] = [
      "starter",
      "pro",
      "business_silver",
      "business_gold",
      "platinum",
    ];
    if (!valid.includes(planId)) {
      throw new BadRequestException("Forfait inconnu");
    }
    return planId;
  }
}
