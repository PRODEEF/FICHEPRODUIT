import { createZodDto } from "nestjs-zod";
import { z } from "zod";

const billingSubscriptionSchema = z.object({
  status: z.string().nullable().describe("Statut Stripe de l'abonnement"),
  periodEnd: z.string().nullable().describe("Fin de période courante (ISO 8601)"),
});

const billingEntitlementSchema = z.object({
  type: z.enum(["free_low_price_exports"]).describe("Type d'avantage actif"),
  expiresAt: z.string().describe("Expiration de l'avantage (ISO 8601)"),
});

const billingCreditLotSchema = z.object({
  id: z.uuid(),
  amountInitial: z.number().int().nonnegative(),
  amountRemaining: z.number().int().nonnegative(),
  source: z.enum(["signup_grant", "pack_purchase", "subscription_grant", "manual"]),
  planId: z.string().nullable(),
  planName: z.string().nullable(),
  sector: z.string().nullable(),
  expiresAt: z.string().nullable(),
  createdAt: z.string(),
});

const billingTransactionSchema = z.object({
  id: z.uuid(),
  delta: z.number().int(),
  reason: z.enum(["export", "expiry", "refund", "grant"]),
  createdAt: z.string(),
  metadata: z.record(z.string(), z.unknown()),
});

export const billingSummaryResponseSchema = z.object({
  balance: z.number().int().nonnegative().describe("Solde crédits disponibles"),
  hasUnlimitedExports: z
    .boolean()
    .describe("Abonnement Platinium actif — exports sans débit"),
  subscription: billingSubscriptionSchema.nullable(),
  entitlements: z.array(billingEntitlementSchema),
  recentPurchases: z.array(billingCreditLotSchema).describe("Lots crédits (achats et offres)"),
  recentTransactions: z.array(billingTransactionSchema),
});

export class BillingSummaryResponseDto extends createZodDto(billingSummaryResponseSchema) {}
