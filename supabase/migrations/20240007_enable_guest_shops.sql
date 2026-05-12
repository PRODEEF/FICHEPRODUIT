-- ============================================================
-- Migration 007 — shops: support guest session ownership
-- ============================================================

ALTER TABLE public.shops
ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.shops
ADD COLUMN IF NOT EXISTS session_id UUID;

ALTER TABLE public.shops
DROP CONSTRAINT IF EXISTS chk_shops_user_xor_session;

ALTER TABLE public.shops
ADD CONSTRAINT chk_shops_user_xor_session
CHECK (
  (user_id IS NOT NULL AND session_id IS NULL)
  OR
  (user_id IS NULL AND session_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_shops_session_id ON public.shops (session_id);
CREATE INDEX IF NOT EXISTS idx_shops_user_url ON public.shops (user_id, url);
CREATE INDEX IF NOT EXISTS idx_shops_session_url ON public.shops (session_id, url);
