-- Archive factures sans PII utilisateur (obligation comptable / RGPD art. 17 §3)
CREATE TABLE public.billing_invoice_archive (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_invoice_id TEXT,
  stripe_checkout_session_id TEXT,
  credits_amount INTEGER,
  source public.credit_lot_source NOT NULL,
  plan_id TEXT,
  sector TEXT,
  purchased_at TIMESTAMPTZ NOT NULL,
  archived_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.billing_invoice_archive ENABLE ROW LEVEL SECURITY;
-- aucune policy authenticated → service_role only

GRANT ALL ON TABLE public.billing_invoice_archive TO service_role;
