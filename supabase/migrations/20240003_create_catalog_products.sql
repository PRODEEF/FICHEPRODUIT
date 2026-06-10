-- ============================================================
-- Migration 003 — catalog_products
-- ============================================================

CREATE TABLE public.catalog_products (
  id                   UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  name                 TEXT           NOT NULL,
  brand                TEXT           NOT NULL,
  sector               TEXT           NOT NULL,
  category             TEXT           NOT NULL,
  sub_category         TEXT,
  year                 SMALLINT,
  price                NUMERIC(12, 2) NOT NULL,
  description          TEXT,
  detailed_description TEXT,
  images               TEXT[]         NOT NULL DEFAULT '{}',
  url                  TEXT           NOT NULL,
  attributes           JSONB          NOT NULL DEFAULT '{}',
  created_at           TIMESTAMPTZ    NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ    NOT NULL DEFAULT now()
);

CREATE INDEX idx_catalog_products_sector   ON public.catalog_products (sector);
CREATE INDEX idx_catalog_products_category ON public.catalog_products (category);
CREATE INDEX idx_catalog_products_brand    ON public.catalog_products (brand);
CREATE INDEX idx_catalog_products_name_fts
  ON public.catalog_products USING GIN (to_tsvector('french', name));
CREATE INDEX idx_catalog_products_attributes
  ON public.catalog_products USING GIN (attributes);

CREATE TRIGGER trg_catalog_products_updated_at
  BEFORE UPDATE ON public.catalog_products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ----------------------------------------------------------------
-- RLS : catalogue global en lecture seule côté client
-- ----------------------------------------------------------------
ALTER TABLE public.catalog_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY catalog_products_select_all
  ON public.catalog_products
  FOR SELECT
  TO anon, authenticated
  USING (true);

GRANT SELECT ON TABLE public.catalog_products TO anon, authenticated;
