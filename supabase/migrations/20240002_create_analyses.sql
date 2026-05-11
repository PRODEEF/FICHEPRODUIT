-- ============================================================
-- Migration 002 — analyses
-- ============================================================

CREATE TYPE public.analysis_status AS ENUM (
  'pending',
  'running',
  'done',
  'failed'
);

CREATE TYPE public.analysis_error_code AS ENUM (
  'SITE_UNREACHABLE',
  'UNANALYZABLE',
  'UNKNOWN_SECTOR',
  'INTERNAL_ERROR'
);

CREATE TABLE public.analyses (
  id            UUID                      PRIMARY KEY DEFAULT gen_random_uuid(),
  url           TEXT                      NOT NULL,
  status        public.analysis_status    NOT NULL DEFAULT 'pending',
  error_code    public.analysis_error_code,          -- nullable
  error_message TEXT,                                -- nullable
  user_id       UUID                      REFERENCES public.users (id) ON DELETE SET NULL,
  session_id    UUID,                               -- guest UUID, pas de FK
  shop_id       UUID                      REFERENCES public.shops (id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ               NOT NULL DEFAULT now(),

  -- Règle métier : userId XOR sessionId — jamais les deux, jamais aucun
  CONSTRAINT chk_analyses_user_xor_session
    CHECK (
      (user_id IS NOT NULL AND session_id IS NULL)
      OR
      (user_id IS NULL AND session_id IS NOT NULL)
    ),

  -- shop_id obligatoire quand status = done
  CONSTRAINT chk_analyses_shop_when_done
    CHECK (
      status <> 'done' OR shop_id IS NOT NULL
    )
);

-- Recherche par user
CREATE INDEX idx_analyses_user_id   ON public.analyses (user_id);
-- Recherche par session guest
CREATE INDEX idx_analyses_session_id ON public.analyses (session_id);
-- Filtrage par status
CREATE INDEX idx_analyses_status    ON public.analyses (status);
-- Rattachement au shop
CREATE INDEX idx_analyses_shop_id   ON public.analyses (shop_id);
