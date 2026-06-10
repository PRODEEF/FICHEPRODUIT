-- ============================================================
-- Migration 001 — users + shops (état final)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Supprime le flux legacy Supabase (profiles) s'il existe encore
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS trg_on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- ----------------------------------------------------------------
-- TABLE : users
-- id = auth.users.id (même UUID)
-- ----------------------------------------------------------------
CREATE TABLE public.users (
  id                   UUID        PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  display_name         TEXT,
  website_url          TEXT,
  pending_auto_analyze BOOLEAN     NOT NULL DEFAULT false,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger signup : crée / met à jour public.users depuis raw_user_meta_data
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  meta_website text;
  meta_pending text;
BEGIN
  meta_website := NULLIF(TRIM(NEW.raw_user_meta_data->>'website_url'), '');
  meta_pending := NEW.raw_user_meta_data->>'pending_auto_analyze';

  INSERT INTO public.users (id, display_name, website_url, pending_auto_analyze)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'display_name',
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name'
    ),
    meta_website,
    CASE
      WHEN meta_pending IS NULL THEN false
      WHEN meta_pending IN ('true', 't', '1', 'yes') THEN true
      ELSE false
    END
  )
  ON CONFLICT (id) DO UPDATE SET
    display_name = COALESCE(EXCLUDED.display_name, public.users.display_name),
    website_url = COALESCE(EXCLUDED.website_url, public.users.website_url),
    pending_auto_analyze = COALESCE(EXCLUDED.pending_auto_analyze, public.users.pending_auto_analyze);
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'handle_new_auth_user failed for auth.users.id=%: % %', NEW.id, SQLERRM, SQLSTATE;
    RAISE;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_new_auth_user() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.handle_new_auth_user() FROM anon, authenticated;

CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- ----------------------------------------------------------------
-- TABLE : shops (utilisateur connecté ou session invité)
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
  user_id     UUID            REFERENCES public.users (id) ON DELETE CASCADE,
  session_id  UUID,
  created_at  TIMESTAMPTZ     NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ     NOT NULL DEFAULT now(),

  CONSTRAINT chk_shops_user_xor_session
    CHECK (
      (user_id IS NOT NULL AND session_id IS NULL)
      OR
      (user_id IS NULL AND session_id IS NOT NULL)
    )
);

CREATE INDEX idx_shops_user_id     ON public.shops (user_id);
CREATE INDEX idx_shops_session_id  ON public.shops (session_id);
CREATE INDEX idx_shops_sector      ON public.shops (sector);
CREATE INDEX idx_shops_user_url    ON public.shops (user_id, url);
CREATE INDEX idx_shops_session_url ON public.shops (session_id, url);

-- Trigger updated_at (réutilisé sur toutes les tables)
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

-- ----------------------------------------------------------------
-- RLS : users + shops
-- ----------------------------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY users_select_own
  ON public.users
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY users_insert_own
  ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY users_update_own
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;

CREATE POLICY shops_select_own
  ON public.shops
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY shops_insert_own
  ON public.shops
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY shops_update_own
  ON public.shops
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY shops_delete_own
  ON public.shops
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());
