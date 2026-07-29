-- Planifie la purge des données invité (> 24 h) via pg_cron (Supabase).
-- Exécution toutes les heures.

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- Idempotent : retire l'ancien job s'il existe.
SELECT cron.unschedule(jobid)
FROM cron.job
WHERE jobname = 'cleanup-guest-data-hourly';

SELECT cron.schedule(
  'cleanup-guest-data-hourly',
  '0 * * * *',
  $$SELECT public.cleanup_guest_data_older_than(24);$$
);
