-- ============================================================
-- Migration 018 — unicité du nom de fiche par boutique
-- ============================================================

-- Renommer les doublons existants avant d'ajouter la contrainte
WITH ranked AS (
  SELECT
    id,
    name,
    ROW_NUMBER() OVER (
      PARTITION BY shop_id, lower(btrim(name))
      ORDER BY created_at ASC, id ASC
    ) AS rn
  FROM public.product_templates
)
UPDATE public.product_templates AS pt
SET name = pt.name || ' (' || ranked.rn || ')'
FROM ranked
WHERE pt.id = ranked.id
  AND ranked.rn > 1;

CREATE UNIQUE INDEX idx_product_templates_shop_name_unique
  ON public.product_templates (shop_id, lower(btrim(name)));
