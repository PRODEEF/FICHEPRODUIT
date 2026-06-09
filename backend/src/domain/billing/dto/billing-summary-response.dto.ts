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

const billingTransactionSchema = z.object({
  id: z.uuid(),
  delta: z.number().int(),
  reason: z.enum(["export", "expiry", "refund"]),
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
  recentTransactions: z.array(billingTransactionSchema),
});

export class BillingSummaryResponseDto extends createZodDto(billingSummaryResponseSchema) {}
