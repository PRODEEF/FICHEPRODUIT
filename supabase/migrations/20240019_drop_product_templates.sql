-- Supprime les gabarits fiche produit (table + enum)
DROP TABLE IF EXISTS public.product_templates CASCADE;
DROP TYPE IF EXISTS public.template_field_type;
