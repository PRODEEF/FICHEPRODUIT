/**
 * Client API — Utilisateur
 *
 * Routes NestJS :
 *   POST   /api/users/me/claim-guest-session   (auth requise)
 *   DELETE /api/users/me                       (auth requise, body { password })
 *
 * Flux guest → user après connexion/inscription :
 *   1. L'utilisateur se connecte via Supabase Auth → JWT disponible.
 *   2. On appelle cet endpoint avec le JWT en Authorization header.
 *   3. Le backend lit le cookie httpOnly `ficheproduct_guest_session` et transfère
 *      atomiquement les analyses + shop guest vers l'userId, puis efface le cookie.
 */

import type { ClaimGuestSessionOptions } from '@types-api';

import { isApiError } from './apiError';
import { getApiBaseUrl } from './apiBase';
import { apiFetch, authHeaders } from './apiAuth';

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
    if (isApiError(err) && err.status === 404) return;
    throw err;
  }
}

/**
 * Supprime définitivement le compte de l'utilisateur connecté.
 *
 * Le backend re-vérifie le mot de passe fourni avant d'effacer le compte Supabase Auth ainsi
 * que les ressources associées (profil, shop, analyses…). C'est une opération irréversible :
 * le hook appelant doit s'assurer que l'utilisateur a explicitement confirmé.
 *
 * @throws {ApiError} 401 (mot de passe invalide), 403 (accès refusé), 500 ou réseau.
 */
export async function deleteAccount(password: string): Promise<void> {
  await apiFetch(`${getApiBaseUrl()}/api/users/me`, {
    method: 'DELETE',
    headers: await authHeaders(),
    body: JSON.stringify({ password }),
  });
}
