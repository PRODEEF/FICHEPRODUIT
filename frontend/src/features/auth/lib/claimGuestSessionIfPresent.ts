import { ApiHttpError } from '@api/apiAuth';
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
 */
export async function claimGuestSessionIfPresent(accessToken: string): Promise<boolean> {
  try {
    await claimGuestSession({ accessToken });
    clearGuestSessionId();
    return true;
  } catch (e) {
    if (e instanceof ApiHttpError && (e.status === 400 || e.status === 404)) return false;
    return false;
  }
}
