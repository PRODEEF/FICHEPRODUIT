-- Durcit cleanup_guest_data_older_than : search_path, validation p_hours, EXECUTE réservé à service_role.
-- Corrige l'exposition RPC (SECURITY DEFINER + droits EXECUTE par défaut sur PUBLIC).

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
