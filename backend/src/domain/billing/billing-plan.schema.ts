import { z } from "zod";

/** Identifiants des forfaits tarifaires — source unique (packs + abonnement). */
export const BILLING_PLAN_IDS = [
  "starter",
  "pro",
  "business_silver",
  "business_custom",
  "platinum",
] as const;

export const billingPlanIdSchema = z.enum(BILLING_PLAN_IDS);

export type BillingPlanId = z.infer<typeof billingPlanIdSchema>;

/** Forfaits achetables en ligne — hors devis sur mesure (`business_custom`). */
export const checkoutPlanIdSchema = billingPlanIdSchema.exclude(["business_custom"]);

export type CheckoutPlanId = z.infer<typeof checkoutPlanIdSchema>;

/** Forfaits affichés sur la page tarifs publique. */
export const PUBLIC_PRICING_PLAN_IDS: readonly BillingPlanId[] = BILLING_PLAN_IDS;
