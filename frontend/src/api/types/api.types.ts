/**
 * Types métier partagés — alignés sur le contrat du backend NestJS.
 *
 * Ces types reflètent exactement les entités renvoyées / attendues par les routes
 * `/api/*`. Ne pas les confondre avec `generated/api.ts` (ancien backend).
 *
 * Règle : tout ce qui vient du réseau passe par ces types. Les composants UI
 * n'importent pas directement depuis `generated/api.ts` pour les entités métier.
 */

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

/** Aligné sur l’enum Postgres `shop_cms` ; `other` / `unknown` restent pour la rétrocompat. */
export type CmsType =
  | 'prestashop'
  | 'shopify'
  | 'woocommerce'
  | 'autre'
  | 'inconnu'
  | 'other'
  | 'unknown';

/** Statuts du cycle de vie d'une analyse. */
export type AnalysisStatus = 'pending' | 'running' | 'done' | 'failed';

/** Codes d'erreur métier retournés quand `status === 'failed'`. */
export type AnalysisErrorCode =
  | 'SITE_UNREACHABLE'
  | 'UNANALYZABLE'
  | 'UNKNOWN_SECTOR'
  | 'INTERNAL_ERROR';

// ---------------------------------------------------------------------------
// User
// ---------------------------------------------------------------------------

export interface User {
  id: string;
  email: string;
  username: string;
  websiteUrl: string | null;
  pendingAutoAnalyze: boolean;
}

// ---------------------------------------------------------------------------
// Analysis
// ---------------------------------------------------------------------------

export interface Analysis {
  id: string;
  url: string;
  status: AnalysisStatus;
  errorCode: AnalysisErrorCode | null;
  errorMessage: string | null;
  userId: string | null;
  sessionId: string | null;
  /** Défini quand status === 'done'. */
  shopId: string | null;
  createdAt: string;
}

export interface CreateAnalysisBody {
  url: string;
}

// ---------------------------------------------------------------------------
// Shop
// ---------------------------------------------------------------------------

export interface Shop {
  id: string;
  name: string;
  url: string;
  cms: CmsType;
  sector: string | null;
  brands: string[];
  categories: string[];
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

/** Corps PATCH `PATCH /api/shop` (tous les champs optionnels). */
export interface PatchMyShopBody {
  name?: string;
  url?: string;
  cms?: CmsType;
  sector?: string | null;
  brands?: string[];
  categories?: string[];
}

// ---------------------------------------------------------------------------
// CatalogProduct
// ---------------------------------------------------------------------------

export interface CatalogProduct {
  id: string;
  name: string;
  brand: string;
  sector: string;
  category: string;
  subCategory: string | null;
  year: number;
  price: number;
  description: string;
  detailedDescription: string;
  images: string[];
  url: string;
  attributes: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

export interface ExportBody {
  /** IDs des produits catalogue à exporter. */
  productIds: string[];
  /** UUID de la boutique (contrôle d’accès). */
  shopId: string;
}

// ---------------------------------------------------------------------------
// Billing
// ---------------------------------------------------------------------------

export type BillingPlanId =
  | 'starter'
  | 'pro'
  | 'business_silver'
  | 'business_custom'
  | 'platinum';

export type BillingEntitlementType = 'free_low_price_exports';

export type BillingTransactionReason = 'export' | 'expiry' | 'refund' | 'grant';

export interface BillingSubscriptionSummary {
  status: string | null;
  periodEnd: string | null;
}

export interface BillingEntitlementSummary {
  type: BillingEntitlementType;
  expiresAt: string;
}

export type BillingCreditLotSource =
  | 'signup_grant'
  | 'pack_purchase'
  | 'subscription_grant'
  | 'manual';

export interface BillingCreditLotSummary {
  id: string;
  amountInitial: number;
  amountRemaining: number;
  source: BillingCreditLotSource;
  planId: string | null;
  planName: string | null;
  sector: string | null;
  expiresAt: string | null;
  createdAt: string;
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
  recentPurchases: BillingCreditLotSummary[];
  recentTransactions: BillingTransactionSummary[];
}

export interface PublicPricingPlan {
  id: BillingPlanId;
  name: string;
  priceEur: number;
  pricePerSheetEur: number | null;
  priceSuffix: string | null;
  creditsLabel: string;
  multiplier: number;
}

export interface BillingPlansResponse {
  sector: string;
  multiplier: number;
  plans: PublicPricingPlan[];
}

export interface CreateCheckoutBody {
  planId: BillingPlanId;
  sector: string;
}

export interface CheckoutResponse {
  url: string;
}

// ---------------------------------------------------------------------------
// Suggest URLs
// ---------------------------------------------------------------------------

export interface SuggestUrlsBody {
  q: string;
}

export interface SuggestUrlsResponse {
  urls: string[];
}

// ---------------------------------------------------------------------------
// Guest session claim
// ---------------------------------------------------------------------------

export interface ClaimGuestSessionBody {
  sessionId?: string;
}

export interface ClaimGuestSessionOptions {
  /** Session invité explicite (prioritaire sur sessionStorage). */
  sessionId?: string | null;
  /** JWT fraîchement émis (évite une course avec getSession() juste après signUp). */
  accessToken?: string;
}
