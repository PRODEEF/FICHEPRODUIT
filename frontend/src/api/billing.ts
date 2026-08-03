/**
 * Client API — Facturation et crédits
 *
 * Routes NestJS :
 *   GET  /api/billing/plans
 *   GET  /api/billing/me
 *   POST /api/billing/checkout
 */

import type { ShopSectorLabel } from '@shared/lib/shopSectors';

import { z } from 'zod';

import {
  billingPlansResponseSchema,
  billingSummarySchema,
  checkoutResponseSchema,
} from './billingSchemas';
import type {
  BillingPlansResponse,
  BillingSummary,
  CheckoutResponse,
  CreateCheckoutBody,
} from '@types-api';

import { getSupabaseSessionAuthHeaders, requestNestJson } from './nestHttpClient';

export type {
  BillingEntitlementSummary,
  BillingEntitlementType,
  BillingPlanId,
  BillingPlansResponse,
  BillingSubscriptionSummary,
  BillingSummary,
  BillingTransactionReason,
  BillingTransactionSummary,
  CheckoutResponse,
  CreateCheckoutBody,
  PublicPricingPlan,
} from '@types-api';

function parseApiResponse<S extends z.ZodType>(
  schema: S,
  data: unknown,
  context: string,
): z.infer<S> {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new Error(`Réponse API invalide (${context})`);
  }
  return result.data;
}

/** Récupère les forfaits et tarifs calculés pour un secteur. */
export async function fetchBillingPlans(sector: ShopSectorLabel): Promise<BillingPlansResponse> {
  const params = new URLSearchParams({ sector });
  const raw = await requestNestJson<unknown>({
    method: 'GET',
    path: `/billing/plans?${params.toString()}`,
  });
  return parseApiResponse(billingPlansResponseSchema, raw, 'billing/plans');
}

/** Récupère le solde crédits et le résumé facturation de l'utilisateur connecté. */
export async function fetchBillingMe(): Promise<BillingSummary> {
  const raw = await requestNestJson<unknown>({
    method: 'GET',
    path: '/billing/me',
    authHeaders: getSupabaseSessionAuthHeaders,
  });
  return parseApiResponse(billingSummarySchema, raw, 'billing/me');
}

/** Crée une session Stripe Checkout et retourne l'URL de redirection. */
export async function createCheckoutSession(body: CreateCheckoutBody): Promise<CheckoutResponse> {
  const raw = await requestNestJson<unknown>({
    method: 'POST',
    path: '/billing/checkout',
    body,
    authHeaders: getSupabaseSessionAuthHeaders,
  });
  return parseApiResponse(checkoutResponseSchema, raw, 'billing/checkout');
}
