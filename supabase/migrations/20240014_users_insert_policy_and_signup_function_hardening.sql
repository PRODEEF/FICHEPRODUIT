-- Politique INSERT own sur public.users (fallback ensureRow backend si trigger signup en retard).
-- Révoque l'exécution directe de handle_new_auth_user (trigger auth.users reste actif).

CREATE POLICY users_insert_own
  ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

REVOKE ALL ON FUNCTION public.handle_new_auth_user() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.handle_new_auth_user() FROM anon, authenticated;
