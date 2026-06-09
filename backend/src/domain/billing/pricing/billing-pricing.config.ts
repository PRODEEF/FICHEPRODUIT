import type { ShopSector } from "../../shop/dto/shop-sector.schema";
import type { BillingPlanId } from "../billing-plan.schema";

/** Crédits inclus par pack (hors abonnement Platinium). */
export const PLAN_CREDIT_AMOUNTS: Record<Exclude<BillingPlanId, "business_custom" | "platinum">, number> = {
  starter: 1,
  pro: 10,
  business_silver: 100,
};

/** Libellé d'affichage pour un nombre de crédits pack — dérivé de `PLAN_CREDIT_AMOUNTS`. */
export function formatCreditsLabel(amount: number): string {
  return amount === 1 ? "1 crédit" : `${amount} crédits`;
}

/** Prix de référence HT en euros — secteur Glisse (×1,0). */
export const REFERENCE_PLAN_PRICES_EUR: Record<BillingPlanId, number> = {
  starter: 15,
  pro: 200,
  business_silver: 800,
  business_custom: 2500,
  platinum: 500,
};

/** Multiplicateurs tarifaires par secteur — source unique des tarifs. */
export const SECTOR_PRICE_MULTIPLIERS: Record<ShopSector, number> = {
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
  Autres: 2,
};

export const PACK_PLANS_WITH_FREE_LOW_PRICE: ReadonlySet<Exclude<BillingPlanId, "platinum">> =
  new Set(["business_silver", "business_custom"]);

type ReferencePlanDisplay = {
  name: string;
  /** Prix par fiche affiché sous le montant principal. Si renseigné, `priceSuffix` est ignoré. */
  pricePerSheetEur: number | null;
  /**
   * Complément sous le prix principal lorsque `pricePerSheetEur` est null
   * (ex. abonnement Platinium : « par mois »).
   */
  priceSuffix: string | null;
  /** Libellé crédits custom (business_custom, platinum). Les packs dérivent de `PLAN_CREDIT_AMOUNTS`. */
  creditsLabel?: string;
};

/** Métadonnées d'affichage des forfaits — checkout et page tarifs. */
export const REFERENCE_PLAN_DISPLAY: Record<BillingPlanId, ReferencePlanDisplay> = {
  starter: {
    name: "STARTER",
    pricePerSheetEur: 15,
    priceSuffix: null,
  },
  pro: {
    name: "PRO",
    pricePerSheetEur: 10,
    priceSuffix: null,
  },
  business_silver: {
    name: "BUSINESS SILVER",
    pricePerSheetEur: 8,
    priceSuffix: null,
  },
  business_custom: {
    name: "BUSINESS CUSTOM",
    pricePerSheetEur: null,
    priceSuffix: null,
    creditsLabel: "Crédits à la demande",
  },
  platinum: {
    name: "PLATINIUM",
    pricePerSheetEur: null,
    priceSuffix: "par mois",
    creditsLabel: "Crédits illimités*",
  },
};
