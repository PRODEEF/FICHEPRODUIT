-- Motif d'écriture pour les octrois de crédits (inscription, achat pack).

ALTER TYPE public.credit_transaction_reason ADD VALUE IF NOT EXISTS 'grant';
