-- ============================================================
-- Migration 004 — product_templates (champs stockés en JSONB)
-- ============================================================

CREATE TYPE public.template_field_type AS ENUM (
  'text',
  'long_text',
  'rich_text',
  'number',
  'price',
  'percentage',
  'boolean',
  'date',
  'datetime',
  'url',
  'email',
  'phone',
  'enum',
  'multi_enum',
  'reference',
  'image',
  'file',
  'color',
  'size',
  'weight',
  'dimension',
  'country',
  'currency',
  'json'
);

CREATE TABLE public.product_templates (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT        NOT NULL,
  shop_id    UUID        NOT NULL REFERENCES public.shops (id) ON DELETE CASCADE,
  user_id    UUID        NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  fields     JSONB       NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_product_templates_shop_id ON public.product_templates (shop_id);
CREATE INDEX idx_product_templates_user_id ON public.product_templates (user_id);

CREATE TRIGGER trg_product_templates_updated_at
  BEFORE UPDATE ON public.product_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ----------------------------------------------------------------
-- RLS : product_templates
-- ----------------------------------------------------------------
ALTER TABLE public.product_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY product_templates_select_own
  ON public.product_templates
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY product_templates_insert_own
  ON public.product_templates
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY product_templates_update_own
  ON public.product_templates
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY product_templates_delete_own
  ON public.product_templates
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());
