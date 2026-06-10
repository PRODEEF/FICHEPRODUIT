/** Source d’un lot de crédits — aligné sur l’enum Postgres `credit_lot_source`. */
export type CreditLotSource = "signup_grant" | "pack_purchase" | "subscription_grant" | "manual";

/** Motif d’une écriture dans le journal crédits. */
export type CreditTransactionReason = "export" | "expiry" | "refund" | "grant";

/** Type d’avantage utilisateur (ex. fiches < 200 € offertes). */
export type UserEntitlementType = "free_low_price_exports";

export type { BillingPlanId, CheckoutPlanId } from "../billing-plan.schema";

export type CreditLot = {
  id: string;
  userId: string;
  amountInitial: number;
  amountRemaining: number;
  source: CreditLotSource;
  planId: string | null;
  sector: string | null;
  expiresAt: string | null;
  stripeCheckoutSessionId: string | null;
  stripeInvoiceId: string | null;
  createdAt: string;
};

export type CreateCreditLot = {
  userId: string;
  amountInitial: number;
  amountRemaining: number;
  source: CreditLotSource;
  planId?: string | null;
  sector?: string | null;
  expiresAt?: string | null;
  stripeCheckoutSessionId?: string | null;
  stripeInvoiceId?: string | null;
};

export type CreditTransaction = {
  id: string;
  userId: string;
  lotId: string;
  delta: number;
  reason: CreditTransactionReason;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type UserBilling = {
  userId: string;
  stripeCustomerId: string | null;
  activeSubscriptionId: string | null;
  subscriptionStatus: string | null;
  subscriptionPeriodEnd: string | null;
  createdAt: string;
  updatedAt: string;
};

export type UserEntitlement = {
  id: string;
  userId: string;
  type: UserEntitlementType;
  grantedAt: string;
  expiresAt: string;
  revokedAt: string | null;
};

export type BillingSubscriptionSummary = {
  status: string | null;
  periodEnd: string | null;
};

export type BillingEntitlementSummary = {
  type: UserEntitlementType;
  expiresAt: string;
};

export type BillingTransactionSummary = {
  id: string;
  delta: number;
  reason: CreditTransactionReason;
  createdAt: string;
  metadata: Record<string, unknown>;
};

export type BillingCreditLotSummary = {
  id: string;
  amountInitial: number;
  amountRemaining: number;
  source: CreditLotSource;
  planId: string | null;
  planName: string | null;
  sector: string | null;
  expiresAt: string | null;
  createdAt: string;
};

export type BillingSummary = {
  balance: number;
  hasUnlimitedExports: boolean;
  subscription: BillingSubscriptionSummary | null;
  entitlements: BillingEntitlementSummary[];
  recentPurchases: BillingCreditLotSummary[];
  recentTransactions: BillingTransactionSummary[];
};
