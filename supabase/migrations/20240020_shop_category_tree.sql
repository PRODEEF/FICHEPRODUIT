-- Arborescence des catégories magasin (menu navigation) remplace TEXT[] plat.

ALTER TABLE public.shops
  ADD COLUMN category_tree JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.shops.category_tree IS
  'Arborescence des catégories du site (menu nav). Nœuds { id, name, children }.';

-- Migre chaque tag plat en nœud racine sans enfants.
UPDATE public.shops
SET category_tree = COALESCE(
  (
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', gen_random_uuid()::text,
        'name', cat,
        'children', '[]'::jsonb
      )
      ORDER BY ord
    )
    FROM unnest(categories) WITH ORDINALITY AS t(cat, ord)
  ),
  '[]'::jsonb
)
WHERE cardinality(categories) > 0;

ALTER TABLE public.shops DROP COLUMN categories;
