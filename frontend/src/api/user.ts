/**
 * Client API — Utilisateur
 *
 * Routes NestJS :
 *   POST /api/users/me/claim-guest-session   (auth requise)
 *
 * Le flux guest → user après connexion/inscription :
 *   1. L'utilisateur se connecte via Supabase Auth → JWT disponible.
 *   2. On appelle cet endpoint avec le cookie invité httpOnly et/ou `sessionId` (sessionStorage / `?s=`).
 *   3. Le backend transfère atomiquement les analyses + shop guest vers l'userId et efface le cookie.
 */

import { resolveGuestSessionIdForClaim } from '@lib/analysis/guestSessionStorage';

import type { ClaimGuestSessionBody, ClaimGuestSessionOptions } from './types/api.types';
import { getApiBaseUrl } from './apiBase';
import { apiFetch, ApiHttpError, guestOrAuthHeadersWithGuestSession } from './apiAuth';

export type { ClaimGuestSessionOptions };

/**
 * Transfère les ressources guest (analyses, shop) vers l'utilisateur authentifié.
 *
 * @throws {Error} si la requête échoue côté serveur (hors 404 silencieux).
 */
export async function claimGuestSession(options?: ClaimGuestSessionOptions): Promise<void> {
  const guestSessionId = resolveGuestSessionIdForClaim(options?.sessionId);
  const body: ClaimGuestSessionBody =
    guestSessionId !== null ? { sessionId: guestSessionId } : {};

  try {
    await apiFetch(`${getApiBaseUrl()}/api/users/me/claim-guest-session`, {
      method: 'POST',
      headers: await guestOrAuthHeadersWithGuestSession(
        guestSessionId,
        options?.accessToken,
      ),
      body: JSON.stringify(body),
    });
  } catch (err) {
    if (err instanceof ApiHttpError && err.status === 404) return;
    throw err;
  }
}
