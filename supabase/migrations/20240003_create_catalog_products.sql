-- ============================================================
-- Migration 003 — catalog_products
-- ============================================================

CREATE TABLE public.catalog_products (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT         NOT NULL,
  brand        TEXT         NOT NULL,
  sector       TEXT         NOT NULL,
  category     TEXT         NOT NULL,
  sub_category TEXT,                          -- nullable
  year         SMALLINT,
  price        NUMERIC(12, 2) NOT NULL,       -- non nullable, précision monétaire
  description  TEXT,
  images       TEXT[]       NOT NULL DEFAULT '{}',
  url          TEXT         NOT NULL,
  attributes   JSONB        NOT NULL DEFAULT '{}',  -- Record<string, string>
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Recherche par secteur / catégorie / marque
CREATE INDEX idx_catalog_products_sector   ON public.catalog_products (sector);
CREATE INDEX idx_catalog_products_category ON public.catalog_products (category);
CREATE INDEX idx_catalog_products_brand    ON public.catalog_products (brand);
-- Recherche full-text sur le nom
CREATE INDEX idx_catalog_products_name_fts
  ON public.catalog_products USING GIN (to_tsvector('french', name));
-- Recherche dans les attributs JSONB
CREATE INDEX idx_catalog_products_attributes
  ON public.catalog_products USING GIN (attributes);

CREATE TRIGGER trg_catalog_products_updated_at
  BEFORE UPDATE ON public.catalog_products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
