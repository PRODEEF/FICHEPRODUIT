-- ============================================================
-- Migration 004 — product_templates + product_template_fields
-- Idempotent : réexécutable si une exécution précédente a partiellement
-- réussi ou si les objets existent déjà en local.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.product_templates (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT        NOT NULL,
  shop_id    UUID        NOT NULL REFERENCES public.shops (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ancienne table sans shop_id : CREATE TABLE IF NOT EXISTS ne met pas à jour le schéma.
ALTER TABLE public.product_templates
  ADD COLUMN IF NOT EXISTS shop_id UUID;

DO $$
BEGIN
  ALTER TABLE public.product_templates
    ADD CONSTRAINT product_templates_shop_id_fkey
    FOREIGN KEY (shop_id) REFERENCES public.shops (id) ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.product_templates
  ALTER COLUMN shop_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_product_templates_shop_id ON public.product_templates (shop_id);

DROP TRIGGER IF EXISTS trg_product_templates_updated_at ON public.product_templates;
CREATE TRIGGER trg_product_templates_updated_at
  BEFORE UPDATE ON public.product_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ----------------------------------------------------------------
-- Enum des types de champs
-- ----------------------------------------------------------------
DO $$
BEGIN
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
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.product_template_fields (
  id          UUID                       PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID                       NOT NULL REFERENCES public.product_templates (id) ON DELETE CASCADE,
  name        TEXT                       NOT NULL,
  type        public.template_field_type NOT NULL,
  required    BOOLEAN                    NOT NULL DEFAULT false,
  "order"     INTEGER                    NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ                NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ                NOT NULL DEFAULT now(),

  -- Unicité du nom de champ au sein d'un template
  CONSTRAINT uq_template_field_name UNIQUE (template_id, name),
  -- Unicité de l'ordre au sein d'un template
  CONSTRAINT uq_template_field_order UNIQUE (template_id, "order")
);

CREATE INDEX IF NOT EXISTS idx_ptf_template_id ON public.product_template_fields (template_id);

DROP TRIGGER IF EXISTS trg_product_template_fields_updated_at ON public.product_template_fields;
CREATE TRIGGER trg_product_template_fields_updated_at
  BEFORE UPDATE ON public.product_template_fields
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
