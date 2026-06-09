/**
 * Client API — Facturation et crédits
 *
 * Routes NestJS :
 *   GET  /api/billing/me
 *   POST /api/billing/checkout
 */

import type { ShopSectorLabel } from '@shared/lib/shopSectors';

import type { PricingPlanId } from '../features/marketing/lib/pricingConfig';
import { getSupabaseSessionAuthHeaders, requestNestJson } from './nestHttpClient';

export type BillingEntitlementType = 'free_low_price_exports';

export type BillingTransactionReason = 'export' | 'expiry' | 'refund';

export interface BillingSubscriptionSummary {
  status: string | null;
  periodEnd: string | null;
}

export interface BillingEntitlementSummary {
  type: BillingEntitlementType;
  expiresAt: string;
}

export interface BillingTransactionSummary {
  id: string;
  delta: number;
  reason: BillingTransactionReason;
  createdAt: string;
  metadata: Record<string, unknown>;
}

export interface BillingSummary {
  balance: number;
  hasUnlimitedExports: boolean;
  subscription: BillingSubscriptionSummary | null;
  entitlements: BillingEntitlementSummary[];
  recentTransactions: BillingTransactionSummary[];
}

export interface CreateCheckoutBody {
  planId: PricingPlanId;
  sector: ShopSectorLabel;
}

export interface CheckoutResponse {
  url: string;
}

/** Récupère le solde crédits et le résumé facturation de l'utilisateur connecté. */
export async function fetchBillingMe(): Promise<BillingSummary> {
  return requestNestJson<BillingSummary>({
    method: 'GET',
    path: '/billing/me',
    authHeaders: getSupabaseSessionAuthHeaders,
  });
}

/** Crée une session Stripe Checkout et retourne l'URL de redirection. */
export async function createCheckoutSession(body: CreateCheckoutBody): Promise<CheckoutResponse> {
  return requestNestJson<CheckoutResponse>({
    method: 'POST',
    path: '/billing/checkout',
    body,
    authHeaders: getSupabaseSessionAuthHeaders,
  });
}
