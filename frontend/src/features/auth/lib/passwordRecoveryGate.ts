import type { AuthChangeEvent, Session, SupabaseClient } from '@supabase/supabase-js';

/** Détecte un lien Supabase recovery dans le fragment d’URL (#access_token=…&type=recovery). */
export function isPasswordRecoveryUrl(): boolean {
  if (typeof window === 'undefined') return false;
  return window.location.hash.includes('type=recovery');
}

function isRecoverySession(event: AuthChangeEvent, session: Session | null): boolean {
  if (!session) return false;
  if (event === 'PASSWORD_RECOVERY') return true;
  return event === 'INITIAL_SESSION' && isPasswordRecoveryUrl();
}

/**
 * Attend une session recovery (`PASSWORD_RECOVERY` ou hash recovery) puis appelle `onState`.
 * @returns fonction de nettoyage (désabonnement + timeout).
 */
export function subscribePasswordRecoveryGate(
  supabase: SupabaseClient,
  onState: (ready: boolean) => void,
  options: { timeoutMs?: number } = {},
): () => void {
  const timeoutMs = options.timeoutMs ?? 6000;
  let resolved = false;

  const finish = (ok: boolean) => {
    if (resolved) return;
    resolved = true;
    onState(ok);
  };

  void supabase.auth.getSession().then(({ data: { session } }) => {
    if (session && isPasswordRecoveryUrl()) finish(true);
  });

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((event, session) => {
    if (isRecoverySession(event, session)) finish(true);
  });

  const t = window.setTimeout(() => {
    if (resolved) return;
    void supabase.auth.getSession().then(({ data: { session } }) => {
      finish(Boolean(session && isPasswordRecoveryUrl()));
    });
  }, timeoutMs);

  return () => {
    window.clearTimeout(t);
    subscription.unsubscribe();
  };
}
