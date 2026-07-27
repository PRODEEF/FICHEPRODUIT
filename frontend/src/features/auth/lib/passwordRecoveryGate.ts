import type { AuthChangeEvent, Session, SupabaseClient } from '@supabase/supabase-js';

const RESET_PASSWORD_PATH_SUFFIX = '/auth/reset-password';
const RECOVERY_INTENT_KEY = 'ficheproduit.password_recovery_intent';
const RECOVERY_INTENT_TTL_MS = 15 * 60 * 1000;
const DEFAULT_TIMEOUT_MS = 6_000;
const POLL_INTERVAL_MS = 300;

function getBrowserSessionStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    // Vitest (node) peut exposer `window` sans `sessionStorage` (undefined)
    const storage = window.sessionStorage;
    return storage;
  } catch {
    return null;
  }
}

function isOnResetPasswordRoute(): boolean {
  if (typeof window === 'undefined') return false;
  return window.location.pathname.endsWith(RESET_PASSWORD_PATH_SUFFIX);
}

/** Indique que l’URL actuelle provient d’un e-mail de réinitialisation (hash ou PKCE). */
export function isPasswordRecoveryUrl(): boolean {
  if (typeof window === 'undefined') return false;
  if (!isOnResetPasswordRoute()) return false;

  const { hash, search } = window.location;
  if (hash.includes('type=recovery') || hash.includes('access_token')) return true;

  const params = new URLSearchParams(search);
  if (params.get('type') === 'recovery') return true;
  if (params.has('code')) return true;
  if (params.has('token_hash')) return true;
  if (params.has('token')) return true;

  return false;
}

/** Mémorise l’intention recovery avant que Supabase ne consomme le hash (import tôt dans main/App). */
export function capturePasswordRecoveryIntent(): void {
  const storage = getBrowserSessionStorage();
  if (storage === null) return;
  if (!isPasswordRecoveryUrl()) return;
  storage.setItem(RECOVERY_INTENT_KEY, String(Date.now()));
}

export function hasPasswordRecoveryIntent(): boolean {
  const storage = getBrowserSessionStorage();
  if (storage === null) return false;
  const raw = storage.getItem(RECOVERY_INTENT_KEY);
  if (raw === null) return false;
  const ts = Number(raw);
  if (!Number.isFinite(ts)) return true;
  return Date.now() - ts < RECOVERY_INTENT_TTL_MS;
}

export function clearPasswordRecoveryIntent(): void {
  const storage = getBrowserSessionStorage();
  if (storage === null) return;
  storage.removeItem(RECOVERY_INTENT_KEY);
}

function markPasswordRecoveryIntent(): void {
  const storage = getBrowserSessionStorage();
  if (storage === null) return;
  storage.setItem(RECOVERY_INTENT_KEY, String(Date.now()));
}

/** Retire les paramètres recovery (hash ou query) de l’URL après prise en charge. */
export function clearPasswordRecoveryHash(): void {
  if (typeof window === 'undefined') return;
  const { hash, search, pathname } = window.location;
  const params = new URLSearchParams(search);
  const hasHashRecovery =
    hash.includes('type=recovery') || (hash.includes('access_token') && isOnResetPasswordRoute());
  const hasQueryRecovery =
    params.get('type') === 'recovery' ||
    params.has('code') ||
    params.has('token_hash') ||
    params.has('token');

  if (!hasHashRecovery && !hasQueryRecovery) return;

  if (hasHashRecovery) {
    const path = `${pathname}${search}`;
    window.history.replaceState(null, '', path);
    return;
  }

  params.delete('code');
  params.delete('type');
  params.delete('token_hash');
  params.delete('token');
  const nextSearch = params.toString();
  const path = `${pathname}${nextSearch ? `?${nextSearch}` : ''}`;
  window.history.replaceState(null, '', path);
}

function isPasswordRecoveryEvent(event: AuthChangeEvent): boolean {
  return event === 'PASSWORD_RECOVERY';
}

function isRecoverySessionEvent(event: AuthChangeEvent): boolean {
  return event === 'SIGNED_IN' || event === 'INITIAL_SESSION';
}

function hasRecoveryContext(): boolean {
  return hasPasswordRecoveryIntent() || isPasswordRecoveryUrl();
}

function canAcceptSessionForRecovery(
  event: AuthChangeEvent,
  session: Session | null,
  hadRecoveryContext: boolean,
): boolean {
  if (!session) return false;
  if (isPasswordRecoveryEvent(event)) return true;
  if (!hadRecoveryContext && !hasRecoveryContext()) return false;
  return isRecoverySessionEvent(event);
}

function canAcceptSessionFromPoll(session: Session | null, hadRecoveryContext: boolean): boolean {
  if (!session) return false;
  return hadRecoveryContext || hasRecoveryContext();
}

/**
 * Échange explicitement code / token_hash présents dans l’URL (PKCE ou template e-mail).
 */
export async function establishPasswordRecoverySession(
  supabase: SupabaseClient,
): Promise<Session | null> {
  capturePasswordRecoveryIntent();

  if (typeof window === 'undefined') return null;

  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return null;
  }

  const tokenHash = params.get('token_hash');
  if (tokenHash && params.get('type') === 'recovery') {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: 'recovery',
    });
    if (error) return null;
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}

/**
 * Attend la validation du lien recovery puis appelle `onState(true)`.
 * @returns fonction de nettoyage (désabonnement + timers).
 */
export function subscribePasswordRecoveryGate(
  supabase: SupabaseClient,
  onState: (ready: boolean) => void,
  options: { timeoutMs?: number } = {},
): () => void {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  capturePasswordRecoveryIntent();
  const hadRecoveryContext = hasRecoveryContext();
  let resolved = false;

  const finish = (ok: boolean) => {
    if (resolved) return;
    resolved = true;
    if (ok) {
      clearPasswordRecoveryHash();
    } else {
      clearPasswordRecoveryIntent();
    }
    onState(ok);
  };

  const tryAcceptSession = (session: Session | null, event?: AuthChangeEvent) => {
    if (!session) return;
    if (event && isPasswordRecoveryEvent(event)) {
      markPasswordRecoveryIntent();
      finish(true);
      return;
    }
    if (event && canAcceptSessionForRecovery(event, session, hadRecoveryContext)) {
      finish(true);
      return;
    }
    if (!event && canAcceptSessionFromPoll(session, hadRecoveryContext)) {
      finish(true);
    }
  };

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((event, session) => {
    if (isPasswordRecoveryEvent(event) && session) {
      markPasswordRecoveryIntent();
    }
    tryAcceptSession(session, event);
  });

  void establishPasswordRecoverySession(supabase).then((session) => {
    tryAcceptSession(session);
  });

  const pollId = window.setInterval(() => {
    if (resolved) return;
    void supabase.auth.getSession().then(({ data: { session } }) => {
      tryAcceptSession(session);
    });
  }, POLL_INTERVAL_MS);

  const timeoutId = window.setTimeout(() => {
    if (resolved) return;
    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (resolved) return;
      if (canAcceptSessionFromPoll(session, hadRecoveryContext)) {
        finish(true);
        return;
      }
      finish(false);
    });
  }, timeoutMs);

  return () => {
    window.clearInterval(pollId);
    window.clearTimeout(timeoutId);
    subscription.unsubscribe();
  };
}
