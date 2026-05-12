-- ============================================================
-- Migration 005 — Row Level Security (RLS)
-- Politiques pour les rôles PostgREST : anon, authenticated.
-- Le rôle service_role (backend) contourne RLS par défaut sur Supabase.
-- ============================================================

-- ----------------------------------------------------------------
-- public.users
-- ----------------------------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY users_select_own
  ON public.users
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY users_update_own
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Pas de politique INSERT : la ligne est créée par le trigger signup (définition sécurisée).

-- ----------------------------------------------------------------
-- public.shops
-- ----------------------------------------------------------------
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

-- ----------------------------------------------------------------
-- public.analyses
-- Lignes invité (session_id renseigné, user_id NULL) : accès backend / service_role
-- uniquement, pas via JWT utilisateur.
-- ----------------------------------------------------------------
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY analyses_select_own
  ON public.analyses
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY analyses_insert_own
  ON public.analyses
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND session_id IS NULL
  );

CREATE POLICY analyses_update_own
  ON public.analyses
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND session_id IS NULL
  );

CREATE POLICY analyses_delete_own
  ON public.analyses
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ----------------------------------------------------------------
-- public.catalog_products — catalogue global en lecture seule côté client
-- ----------------------------------------------------------------
ALTER TABLE public.catalog_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY catalog_products_select_all
  ON public.catalog_products
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Pas d’INSERT/UPDATE/DELETE pour anon ni authenticated (réservé au service_role si besoin).

-- ----------------------------------------------------------------
-- public.product_templates
-- ----------------------------------------------------------------
ALTER TABLE public.product_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY product_templates_select_owner
  ON public.product_templates
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.shops s
      WHERE s.id = product_templates.shop_id
        AND s.user_id = auth.uid()
    )
  );

CREATE POLICY product_templates_insert_owner
  ON public.product_templates
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.shops s
      WHERE s.id = product_templates.shop_id
        AND s.user_id = auth.uid()
    )
  );

CREATE POLICY product_templates_update_owner
  ON public.product_templates
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.shops s
      WHERE s.id = product_templates.shop_id
        AND s.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.shops s
      WHERE s.id = product_templates.shop_id
        AND s.user_id = auth.uid()
    )
  );

CREATE POLICY product_templates_delete_owner
  ON public.product_templates
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.shops s
      WHERE s.id = product_templates.shop_id
        AND s.user_id = auth.uid()
    )
  );

-- ----------------------------------------------------------------
-- public.product_template_fields
-- ----------------------------------------------------------------
ALTER TABLE public.product_template_fields ENABLE ROW LEVEL SECURITY;

CREATE POLICY product_template_fields_select_owner
  ON public.product_template_fields
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.product_templates pt
      INNER JOIN public.shops s ON s.id = pt.shop_id
      WHERE pt.id = product_template_fields.template_id
        AND s.user_id = auth.uid()
    )
  );

CREATE POLICY product_template_fields_insert_owner
  ON public.product_template_fields
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.product_templates pt
      INNER JOIN public.shops s ON s.id = pt.shop_id
      WHERE pt.id = product_template_fields.template_id
        AND s.user_id = auth.uid()
    )
  );

CREATE POLICY product_template_fields_update_owner
  ON public.product_template_fields
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.product_templates pt
      INNER JOIN public.shops s ON s.id = pt.shop_id
      WHERE pt.id = product_template_fields.template_id
        AND s.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.product_templates pt
      INNER JOIN public.shops s ON s.id = pt.shop_id
      WHERE pt.id = product_template_fields.template_id
        AND s.user_id = auth.uid()
    )
  );

CREATE POLICY product_template_fields_delete_owner
  ON public.product_template_fields
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.product_templates pt
      INNER JOIN public.shops s ON s.id = pt.shop_id
      WHERE pt.id = product_template_fields.template_id
        AND s.user_id = auth.uid()
    )
  );
