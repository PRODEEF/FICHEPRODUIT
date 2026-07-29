/**
 * Client API — Utilisateur
 *
 * Routes NestJS :
 *   POST /api/users/me/claim-guest-session   (auth requise)
 *
 * Flux guest → user après connexion/inscription :
 *   1. L'utilisateur se connecte via Supabase Auth → JWT disponible.
 *   2. On appelle cet endpoint avec le JWT en Authorization header.
 *   3. Le backend lit le cookie httpOnly `ficheproduct_guest_session` et transfère
 *      atomiquement les analyses + shop guest vers l'userId, puis efface le cookie.
 */

import type { ClaimGuestSessionOptions } from './types/api.types';
import { getApiBaseUrl } from './apiBase';
import { apiFetch, ApiHttpError, authHeaders } from './apiAuth';

export type { ClaimGuestSessionOptions };

/**
 * Transfère les ressources guest (analyses, shop) vers l'utilisateur authentifié.
 * Le backend lit le cookie httpOnly pour identifier la session — aucun sessionId en body.
 *
 * @throws {Error} si la requête échoue côté serveur (hors 404 silencieux).
 */
export async function claimGuestSession(options?: ClaimGuestSessionOptions): Promise<void> {
  try {
    await apiFetch(`${getApiBaseUrl()}/api/users/me/claim-guest-session`, {
      method: 'POST',
      headers: await authHeaders(options?.accessToken),
      body: JSON.stringify({}),
    });
  } catch (err) {
    if (err instanceof ApiHttpError && err.status === 404) return;
    throw err;
  }
}
