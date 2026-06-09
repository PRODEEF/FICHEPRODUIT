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
  error_code    public.analysis_error_code,
  error_message TEXT,
  user_id       UUID                      REFERENCES public.users (id) ON DELETE SET NULL,
  session_id    UUID,
  shop_id       UUID                      REFERENCES public.shops (id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ               NOT NULL DEFAULT now(),

  CONSTRAINT chk_analyses_user_xor_session
    CHECK (
      (user_id IS NOT NULL AND session_id IS NULL)
      OR
      (user_id IS NULL AND session_id IS NOT NULL)
    ),

  CONSTRAINT chk_analyses_shop_when_done
    CHECK (
      status <> 'done' OR shop_id IS NOT NULL
    )
);

CREATE INDEX idx_analyses_user_id    ON public.analyses (user_id);
CREATE INDEX idx_analyses_session_id ON public.analyses (session_id);
CREATE INDEX idx_analyses_status     ON public.analyses (status);
CREATE INDEX idx_analyses_shop_id    ON public.analyses (shop_id);

-- ----------------------------------------------------------------
-- RLS : analyses (lignes invité : backend / service_role uniquement)
-- ----------------------------------------------------------------
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY analyses_select_own
  ON public.analyses
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY analyses_insert_own
  ON public.analyses
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND session_id IS NULL
  );

CREATE POLICY analyses_update_own
  ON public.analyses
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND session_id IS NULL
  );

CREATE POLICY analyses_delete_own
  ON public.analyses
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ----------------------------------------------------------------
-- Purge des données invité (24 h par défaut, service_role uniquement)
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.cleanup_guest_data_older_than(p_hours INTEGER DEFAULT 24)
RETURNS TABLE (deleted_analyses INTEGER, deleted_shops INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hours INTEGER;
  v_cutoff TIMESTAMPTZ;
  v_deleted_analyses INTEGER := 0;
  v_deleted_shops INTEGER := 0;
BEGIN
  v_hours := COALESCE(p_hours, 24);

  IF v_hours < 1 OR v_hours > 168 THEN
    RAISE EXCEPTION 'p_hours must be between 1 and 168 (got %)', v_hours
      USING ERRCODE = '22023';
  END IF;

  v_cutoff := now() - make_interval(hours => v_hours);

  DELETE FROM public.analyses a
  WHERE a.user_id IS NULL
    AND a.session_id IS NOT NULL
    AND a.created_at < v_cutoff;
  GET DIAGNOSTICS v_deleted_analyses = ROW_COUNT;

  DELETE FROM public.shops s
  WHERE s.user_id IS NULL
    AND s.session_id IS NOT NULL
    AND s.created_at < v_cutoff;
  GET DIAGNOSTICS v_deleted_shops = ROW_COUNT;

  RETURN QUERY SELECT v_deleted_analyses, v_deleted_shops;
END;
$$;

REVOKE ALL ON FUNCTION public.cleanup_guest_data_older_than(INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cleanup_guest_data_older_than(INTEGER) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_guest_data_older_than(INTEGER) TO service_role;

COMMENT ON FUNCTION public.cleanup_guest_data_older_than(INTEGER)
IS 'Purge analyses et shops guest plus vieux que p_hours (1–168, défaut 24). Réservé au rôle service_role (cron / backend).';
