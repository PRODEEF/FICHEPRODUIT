/**
 * Nettoyage legacy du sessionId invité en sessionStorage.
 *
 * L'authentification invité repose uniquement sur le cookie httpOnly
 * `ficheproduct_guest_session`. Ce module ne sert qu'à effacer d'éventuels
 * restes sessionStorage après un claim réussi.
 */

const STORAGE_KEY = 'ficheproduct_guest_session_id';

export function clearGuestSessionId(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
