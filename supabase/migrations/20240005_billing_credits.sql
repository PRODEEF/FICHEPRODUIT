-- ============================================================
-- Migration 005 — Billing : crédits, abonnements Stripe, entitlements
-- Écriture réservée au service_role (backend) ; lecture par l'utilisateur connecté.
-- ============================================================

CREATE TYPE public.credit_lot_source AS ENUM (
  'signup_grant',
  'pack_purchase',
  'subscription_grant',
  'manual'
);

CREATE TYPE public.credit_transaction_reason AS ENUM (
  'export',
  'expiry',
  'refund'
);

CREATE TYPE public.user_entitlement_type AS ENUM (
  'free_low_price_exports'
);

CREATE TABLE public.user_billing (
  user_id                  UUID        PRIMARY KEY REFERENCES public.users (id) ON DELETE CASCADE,
  stripe_customer_id       TEXT        UNIQUE,
  active_subscription_id   TEXT,
  subscription_status      TEXT,
  subscription_period_end  TIMESTAMPTZ,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_billing_stripe_customer_id
  ON public.user_billing (stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

CREATE TRIGGER trg_user_billing_updated_at
  BEFORE UPDATE ON public.user_billing
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.credit_lots (
  id                          UUID                      PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                     UUID                      NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  amount_initial              INTEGER                   NOT NULL,
  amount_remaining            INTEGER                   NOT NULL,
  source                      public.credit_lot_source  NOT NULL,
  plan_id                     TEXT,
  sector                      TEXT,
  expires_at                  TIMESTAMPTZ,
  stripe_checkout_session_id  TEXT,
  stripe_invoice_id           TEXT,
  created_at                  TIMESTAMPTZ               NOT NULL DEFAULT now(),

  CONSTRAINT credit_lots_amount_initial_positive
    CHECK (amount_initial > 0),
  CONSTRAINT credit_lots_amount_remaining_valid
    CHECK (amount_remaining >= 0 AND amount_remaining <= amount_initial)
);

CREATE INDEX idx_credit_lots_user_expires_fifo
  ON public.credit_lots (user_id, expires_at NULLS LAST, created_at);

CREATE UNIQUE INDEX idx_credit_lots_stripe_checkout_session_id
  ON public.credit_lots (stripe_checkout_session_id)
  WHERE stripe_checkout_session_id IS NOT NULL;

CREATE UNIQUE INDEX idx_credit_lots_stripe_invoice_id
  ON public.credit_lots (stripe_invoice_id)
  WHERE stripe_invoice_id IS NOT NULL;

CREATE UNIQUE INDEX idx_credit_lots_signup_grant_per_user
  ON public.credit_lots (user_id)
  WHERE source = 'signup_grant';

CREATE TABLE public.credit_transactions (
  id          UUID                              PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID                              NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  lot_id      UUID                              NOT NULL REFERENCES public.credit_lots (id) ON DELETE RESTRICT,
  delta       INTEGER                           NOT NULL,
  reason      public.credit_transaction_reason  NOT NULL,
  metadata    JSONB                             NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ                       NOT NULL DEFAULT now(),

  CONSTRAINT credit_transactions_delta_nonzero
    CHECK (delta <> 0)
);

CREATE INDEX idx_credit_transactions_user_created
  ON public.credit_transactions (user_id, created_at DESC);

CREATE INDEX idx_credit_transactions_lot_id
  ON public.credit_transactions (lot_id);

CREATE TABLE public.user_entitlements (
  id          UUID                            PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID                            NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  type        public.user_entitlement_type    NOT NULL,
  granted_at  TIMESTAMPTZ                     NOT NULL DEFAULT now(),
  expires_at  TIMESTAMPTZ                     NOT NULL,
  revoked_at  TIMESTAMPTZ
);

CREATE INDEX idx_user_entitlements_user_type
  ON public.user_entitlements (user_id, type);

CREATE UNIQUE INDEX idx_user_entitlements_active_per_user_type
  ON public.user_entitlements (user_id, type)
  WHERE revoked_at IS NULL;

ALTER TABLE public.user_billing ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_billing_select_own
  ON public.user_billing
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

ALTER TABLE public.credit_lots ENABLE ROW LEVEL SECURITY;

CREATE POLICY credit_lots_select_own
  ON public.credit_lots
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY credit_transactions_select_own
  ON public.credit_transactions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

ALTER TABLE public.user_entitlements ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_entitlements_select_own
  ON public.user_entitlements
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

GRANT SELECT ON TABLE public.user_billing TO authenticated;
GRANT SELECT ON TABLE public.credit_lots TO authenticated;
GRANT SELECT ON TABLE public.credit_transactions TO authenticated;
GRANT SELECT ON TABLE public.user_entitlements TO authenticated;
