-- ============================================================
-- Migration 008 — guest data cleanup (24h)
-- ============================================================

CREATE OR REPLACE FUNCTION public.cleanup_guest_data_older_than(p_hours INTEGER DEFAULT 24)
RETURNS TABLE (deleted_analyses INTEGER, deleted_shops INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_cutoff TIMESTAMPTZ := now() - make_interval(hours => p_hours);
  v_deleted_analyses INTEGER := 0;
  v_deleted_shops INTEGER := 0;
BEGIN
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

COMMENT ON FUNCTION public.cleanup_guest_data_older_than(INTEGER)
IS 'Purge analyses et shops guest plus vieux que p_hours (24h par défaut). A exécuter périodiquement via cron.';
