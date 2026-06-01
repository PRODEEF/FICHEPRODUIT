/**
 * Client API — Utilisateur
 *
 * Routes NestJS :
 *   POST /api/users/me/claim-guest-session   (auth requise)
 *
 * Le flux guest → user après connexion/inscription :
 *   1. L'utilisateur se connecte via Supabase Auth → JWT disponible.
 *   2. On appelle cet endpoint avec le cookie invité httpOnly encore présent (`credentials: 'include'`).
 *   3. Le backend transfère atomiquement les analyses + shop guest vers l'userId et efface le cookie.
 */

import type { ClaimGuestSessionBody } from './types/api.types';
import { getApiBaseUrl } from './apiBase';
import { apiFetch, authHeaders } from './apiAuth';

/**
 * Transfère les ressources guest (analyses, shop) vers l'utilisateur authentifié.
 * Le cookie invité httpOnly doit être envoyé avec la requête.
 *
 * @throws {Error} si la requête échoue côté serveur (hors 404 silencieux).
 */
export async function claimGuestSession(): Promise<void> {
  try {
    await apiFetch(`${getApiBaseUrl()}/api/users/me/claim-guest-session`, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify({} satisfies ClaimGuestSessionBody),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : '';
    if (message.includes('introuvable') || message.includes('404')) {
      return;
    }
    throw err;
  }
}
