import { z } from 'zod';

import { SHOP_SECTOR_LABELS } from '@shared/lib/shopSectors';

const billingPlanIdSchema = z.enum([
  'starter',
  'pro',
  'business_silver',
  'business_custom',
  'platinum',
]);

const billingEntitlementTypeSchema = z.enum(['free_low_price_exports']);

const billingTransactionReasonSchema = z.enum(['export', 'expiry', 'refund', 'grant']);

const billingCreditLotSourceSchema = z.enum([
  'signup_grant',
  'pack_purchase',
  'subscription_grant',
  'manual',
]);

export const publicPricingPlanSchema = z.object({
  id: billingPlanIdSchema,
  name: z.string(),
  priceEur: z.number(),
  pricePerSheetEur: z.number().nullable(),
  priceSuffix: z.string().nullable(),
  creditsLabel: z.string(),
  multiplier: z.number(),
});

export const billingPlansResponseSchema = z.object({
  sector: z.enum(SHOP_SECTOR_LABELS),
  multiplier: z.number(),
  plans: z.array(publicPricingPlanSchema),
});

export const billingSummarySchema = z.object({
  balance: z.number(),
  hasUnlimitedExports: z.boolean(),
  subscription: z
    .object({
      status: z.string().nullable(),
      periodEnd: z.string().nullable(),
    })
    .nullable(),
  entitlements: z.array(
    z.object({
      type: billingEntitlementTypeSchema,
      expiresAt: z.string(),
    }),
  ),
  recentPurchases: z.array(
    z.object({
      id: z.string(),
      amountInitial: z.number(),
      amountRemaining: z.number(),
      source: billingCreditLotSourceSchema,
      planId: z.string().nullable(),
      planName: z.string().nullable(),
      sector: z.string().nullable(),
      expiresAt: z.string().nullable(),
      createdAt: z.string(),
    }),
  ),
  recentTransactions: z.array(
    z.object({
      id: z.string(),
      delta: z.number(),
      reason: billingTransactionReasonSchema,
      createdAt: z.string(),
      metadata: z.record(z.string(), z.unknown()),
    }),
  ),
});

export const checkoutResponseSchema = z.object({
  url: z.url(),
});
