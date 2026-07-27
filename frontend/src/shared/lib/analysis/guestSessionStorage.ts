/**
 * Persistance du sessionId invité pour le claim post-auth (filet si cookie httpOnly absent).
 * Distinct du cache mémoire dans analysisStorage.ts.
 */

import { isValidGuestSessionId } from './analysisStorage';

const STORAGE_KEY = 'ficheproduct_guest_session_id';

export function setGuestSessionId(id: string): void {
  if (!isValidGuestSessionId(id)) return;
  try {
    sessionStorage.setItem(STORAGE_KEY, id);
  } catch {
    // sessionStorage indisponible (mode privé strict, etc.)
  }
}

export function getGuestSessionId(): string | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return isValidGuestSessionId(raw) ? raw : null;
  } catch {
    return null;
  }
}

export function clearGuestSessionId(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

function firstValidSessionId(...candidates: (string | null | undefined)[]): string | null {
  for (const candidate of candidates) {
    const trimmed = candidate?.trim();
    if (isValidGuestSessionId(trimmed)) return trimmed;
  }
  return null;
}

/**
 * Résout la session invité : sessionStorage → query `?s=` → sessionId renvoyé par l’API analyse.
 */
export function resolveGuestSessionId(
  sessionIdFromQuery?: string | null,
  sessionIdFromAnalysis?: string | null,
): string | null {
  const fromStorage = getGuestSessionId();
  if (fromStorage) return fromStorage;
  return firstValidSessionId(sessionIdFromQuery, sessionIdFromAnalysis);
}

/**
 * Résout la session pour le claim : argument explicite → sessionStorage.
 */
export function resolveGuestSessionIdForClaim(explicitSessionId?: string | null): string | null {
  return firstValidSessionId(explicitSessionId) ?? getGuestSessionId();
}

/** Persiste la session invité depuis l’URL ou l’analyse si disponible. */
export function persistGuestSessionFromSources(
  sessionIdFromQuery?: string | null,
  sessionIdFromAnalysis?: string | null,
): void {
  const resolved = resolveGuestSessionId(sessionIdFromQuery, sessionIdFromAnalysis);
  if (resolved) setGuestSessionId(resolved);
}
