import { isApiError } from '@api/apiError';
import { claimGuestSession } from '@api/user';
import { clearGuestSessionId } from '@lib/analysis/guestSessionStorage';

/**
 * Tente le transfert guest → compte via le cookie httpOnly `ficheproduct_guest_session`.
 *
 * Le claim est toujours tenté — pas besoin de sessionStorage pour décider.
 * En cas de succès, le reliquat sessionStorage est nettoyé.
 *
 * @returns `true` si le claim a réussi, `false` si aucun cookie de session invité
 *          n'était présent (400) ou si la ressource est introuvable (404).
 * @throws Relance toute autre erreur (`ApiError` 401/5xx, `NetworkError`, etc.).
 */
export async function claimGuestSessionIfPresent(accessToken: string): Promise<boolean> {
  try {
    await claimGuestSession({ accessToken });
    clearGuestSessionId();
    return true;
  } catch (e) {
    // Absence de session invité = cas nominal, pas une erreur pour l'appelant.
    if (isApiError(e) && (e.status === 400 || e.status === 404)) return false;
    throw e;
  }
}
