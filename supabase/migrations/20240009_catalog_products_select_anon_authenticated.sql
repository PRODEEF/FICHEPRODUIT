-- ============================================================
-- Migration 009 — catalog_products : lecture publique (Data API)
-- ============================================================
-- Si RLS est activé sans politique SELECT, PostgREST renvoie 0 ligne
-- ("no RLS policies exist so no data will be returned").
-- Cette migration est idempotente : recrée la politique de lecture ouverte
-- pour les rôles exposés par l’API Supabase (invité + connecté).
-- ============================================================

ALTER TABLE public.catalog_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS catalog_products_select_all ON public.catalog_products;

CREATE POLICY catalog_products_select_all
  ON public.catalog_products
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Droits explicites sur la table (complément aux politiques RLS)
GRANT SELECT ON TABLE public.catalog_products TO anon, authenticated;

-- Pas d’INSERT/UPDATE/DELETE pour anon/authenticated : catalogue géré côté serveur / migrations.
