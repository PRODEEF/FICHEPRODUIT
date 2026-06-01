import type { AuthChangeEvent, SupabaseClient } from '@supabase/supabase-js';

/** Retire le fragment recovery (#access_token=…&type=recovery) de l’URL après prise en charge. */
export function clearPasswordRecoveryHash(): void {
  if (typeof window === 'undefined') return;
  if (!window.location.hash.includes('type=recovery')) return;
  const path = `${window.location.pathname}${window.location.search}`;
  window.history.replaceState(null, '', path);
}

function isPasswordRecoveryEvent(event: AuthChangeEvent): boolean {
  return event === 'PASSWORD_RECOVERY';
}

/**
 * Attend l’événement Supabase `PASSWORD_RECOVERY` puis appelle `onState(true)`.
 * Ne s’appuie pas sur le hash d’URL ni sur une session existante (évite le bypass reset).
 * @returns fonction de nettoyage (désabonnement + timeout d’échec).
 */
export function subscribePasswordRecoveryGate(
  supabase: SupabaseClient,
  onState: (ready: boolean) => void,
  options: { timeoutMs?: number } = {},
): () => void {
  const timeoutMs = options.timeoutMs ?? 12_000;
  let resolved = false;

  const finish = (ok: boolean) => {
    if (resolved) return;
    resolved = true;
    if (ok) clearPasswordRecoveryHash();
    onState(ok);
  };

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((event, session) => {
    if (isPasswordRecoveryEvent(event) && session) {
      finish(true);
    }
  });

  const t = window.setTimeout(() => {
    if (!resolved) finish(false);
  }, timeoutMs);

  return () => {
    window.clearTimeout(t);
    subscription.unsubscribe();
  };
}
