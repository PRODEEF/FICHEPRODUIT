-- Alignement product_templates : client_id → user_id (référence public.users)
-- Idempotent : ne fait rien si la colonne user_id existe déjà.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'product_templates'
      AND column_name = 'client_id'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'product_templates'
      AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.product_templates
      RENAME COLUMN client_id TO user_id;
  END IF;
END $$;

-- FK vers users si absente (nom peut varier selon l’historique Supabase)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'product_templates'
      AND constraint_name = 'product_templates_user_id_fkey'
  ) THEN
    ALTER TABLE public.product_templates
      ADD CONSTRAINT product_templates_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES public.users (id) ON DELETE CASCADE;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
