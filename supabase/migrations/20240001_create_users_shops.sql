-- ============================================================
-- Migration 001 — users + shops
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------
-- TABLE : users
-- id     = auth.users.id (même UUID)
-- display_name =
--   initialisé depuis raw_user_meta_data au signup
-- ----------------------------------------------------------------
CREATE TABLE public.users (
  id                   UUID        PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  display_name         TEXT,
  website_url          TEXT,
  pending_auto_analyze BOOLEAN     NOT NULL DEFAULT false,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger : crée la ligne public.users au signup et initialise
-- display_name depuis raw_user_meta_data si présent
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.users (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'display_name',
      NEW.raw_user_meta_data->>'full_name',   -- Google / GitHub OAuth
      NEW.raw_user_meta_data->>'name'          -- fallback générique
    )
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- ----------------------------------------------------------------
-- TABLE : shops
-- ----------------------------------------------------------------
CREATE TYPE public.shop_cms AS ENUM (
  'prestashop',
  'shopify',
  'woocommerce',
  'autre',
  'inconnu'
);

CREATE TABLE public.shops (
  id          UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT            NOT NULL,
  url         TEXT            NOT NULL,
  cms         public.shop_cms NOT NULL DEFAULT 'inconnu',
  sector      TEXT,
  brands      TEXT[]          NOT NULL DEFAULT '{}',
  categories  TEXT[]          NOT NULL DEFAULT '{}',
  user_id     UUID            NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ     NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ     NOT NULL DEFAULT now()
);

CREATE INDEX idx_shops_user_id ON public.shops (user_id);
CREATE INDEX idx_shops_sector  ON public.shops (sector);

-- trigger updated_at automatique (réutilisé sur toutes les tables)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_shops_updated_at
  BEFORE UPDATE ON public.shops
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

