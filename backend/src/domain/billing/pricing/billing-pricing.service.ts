import { Injectable } from "@nestjs/common";

import type { ShopSector } from "../../shop/dto/shop-sector.schema";
import { PUBLIC_PRICING_PLAN_IDS, type BillingPlanId } from "../billing-plan.schema";
import type { PublicPricingPlan, PublicPricingPlansResponse } from "../dto/billing-plans-response.dto";
import {
  formatCreditsLabel,
  PACK_PLANS_WITH_FREE_LOW_PRICE,
  PLAN_CREDIT_AMOUNTS,
  REFERENCE_PLAN_DISPLAY,
  REFERENCE_PLAN_PRICES_EUR,
  SECTOR_PRICE_MULTIPLIERS,
} from "./billing-pricing.config";

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

  /** Montant HT en centimes pour Stripe Checkout. */
  getCheckoutAmountCents(planId: BillingPlanId, sector: ShopSector): number {
    const baseEur = REFERENCE_PLAN_PRICES_EUR[planId];
    const multiplier = this.getSectorMultiplier(sector);
    const amountEur = Math.round(baseEur * multiplier * 100) / 100;
    return Math.round(amountEur * 100);
  }

  getCreditsForPlan(planId: BillingPlanId): number | null {
    if (planId === "platinum" || planId === "business_custom") return null;
    return PLAN_CREDIT_AMOUNTS[planId];
  }

  planGrantsFreeLowPriceExports(planId: BillingPlanId): boolean {
    if (planId === "platinum") return true;
    return PACK_PLANS_WITH_FREE_LOW_PRICE.has(planId);
  }

  getPlanDisplayName(planId: BillingPlanId): string {
    return REFERENCE_PLAN_DISPLAY[planId].name;
  }

  /** Prix HT en euros pour affichage (arrondi à 2 décimales). */
  getDisplayPriceEur(planId: BillingPlanId, sector: ShopSector): number {
    const baseEur = REFERENCE_PLAN_PRICES_EUR[planId];
    const multiplier = this.getSectorMultiplier(sector);
    return Math.round(baseEur * multiplier * 100) / 100;
  }

  /** Liste des forfaits avec prix calculés pour un secteur — consommée par le frontend. */
  getPublicPlansForSector(sector: ShopSector): PublicPricingPlansResponse {
    const multiplier = this.getSectorMultiplier(sector);

    const plans: PublicPricingPlan[] = PUBLIC_PRICING_PLAN_IDS.map((id) => {
      const display = REFERENCE_PLAN_DISPLAY[id];
      const priceEur = this.getDisplayPriceEur(id, sector);
      const pricePerSheetEur =
        display.pricePerSheetEur !== null
          ? Math.round(display.pricePerSheetEur * multiplier * 100) / 100
          : null;

      return {
        id,
        name: display.name,
        priceEur,
        pricePerSheetEur,
        priceSuffix: display.priceSuffix,
        creditsLabel: this.resolveCreditsLabel(id, display),
        multiplier,
      };
    });

    return { sector, multiplier, plans };
  }

  private resolveCreditsLabel(
    planId: BillingPlanId,
    display: (typeof REFERENCE_PLAN_DISPLAY)[BillingPlanId],
  ): string {
    if (display.creditsLabel) {
      return display.creditsLabel;
    }

    if (planId === "platinum" || planId === "business_custom") {
      return "";
    }

    return formatCreditsLabel(PLAN_CREDIT_AMOUNTS[planId]);
  }
}
