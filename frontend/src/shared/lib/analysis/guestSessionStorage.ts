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
