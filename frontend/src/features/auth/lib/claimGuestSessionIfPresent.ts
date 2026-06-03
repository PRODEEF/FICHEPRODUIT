import { claimGuestSession } from '@api/user';
import {
  clearGuestSessionId,
  resolveGuestSessionIdForClaim,
} from '@lib/analysis/guestSessionStorage';

/**
 * Tente le transfert guest → compte si une session invité est disponible.
 *
 * @returns `true` si le claim a réussi.
 */
export async function claimGuestSessionIfPresent(
  accessToken: string,
  explicitSessionId?: string | null,
): Promise<boolean> {
  const sessionId = resolveGuestSessionIdForClaim(explicitSessionId);
  if (!sessionId) return false;

  try {
    await claimGuestSession({ sessionId, accessToken });
    clearGuestSessionId();
    return true;
  } catch {
    return false;
  }
}
