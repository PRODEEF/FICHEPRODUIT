/**
 * Session invité côté navigateur (sessionStorage).
 *
 * Complète le cookie httpOnly `ficheproduct_guest_session` : en cross-origin
 * (ex. localhost → 127.0.0.1, ou front/API Vercel distincts), le cookie SameSite=Lax
 * n'est pas renvoyé. L'en-tête `x-session-id` assure alors la continuité du poll.
 */

import { isValidGuestSessionId } from './analysisStorage';

const STORAGE_KEY = 'ficheproduct_guest_session_id';

function readStored(): string | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return isValidGuestSessionId(raw) ? raw : null;
  } catch {
    return null;
  }
}

function writeStored(id: string): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, id);
  } catch {
    // ignore (mode privé / quota)
  }
}

/** Lit la session invitée déjà connue, sans en créer une. */
export function readGuestSessionId(): string | null {
  return readStored();
}

/** Retourne une session invitée stable pour les appels API guest (crée un UUID si besoin). */
export function getOrCreateGuestSessionId(): string {
  const existing = readStored();
  if (existing) return existing;
  const created = crypto.randomUUID();
  writeStored(created);
  return created;
}

export function clearGuestSessionId(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
