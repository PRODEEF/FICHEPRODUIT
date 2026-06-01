/**
 * Client API — Suggest URLs
 *
 * Route NestJS : POST /api/suggest-urls  (Bearer optionnel ; quota plus élevé si connecté)
 *
 * Prend un hint textuel ("Décathlon", "shop kitesurf bordelais") et retourne
 * une liste d'URLs de sites e-commerce candidates.
 *
 * Pas de normalisation complexe ici : la réponse est simple.
 */

import { getApiBaseUrl } from './apiBase';
import { getSupabaseSessionAuthHeaders } from './nestHttpClient';
import type { SuggestUrlsBody, SuggestUrlsResponse } from './types/api.types';

/**
 * Demande des suggestions d'URLs pour une saisie libre.
 *
 * @param q - Texte saisi par l'utilisateur (nom de marque, description, etc.)
 * @returns Tableau d'URLs (peut être vide si aucun résultat).
 * @throws {Error} si la requête HTTP échoue.
 */
export async function fetchSuggestUrls(q: string): Promise<string[]> {
  const body: SuggestUrlsBody = { q: q.trim() };

  const res = await fetch(`${getApiBaseUrl()}/api/suggest-urls`, {
    method: 'POST',
    headers: await getSupabaseSessionAuthHeaders(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`Suggest request failed: ${res.status}`);
  }

  const data: unknown = await res.json();

  // Normalisation défensive : on attend { urls: string[] }
  if (
    data !== null &&
    typeof data === 'object' &&
    'urls' in data &&
    Array.isArray((data as SuggestUrlsResponse).urls)
  ) {
    return (data as SuggestUrlsResponse).urls.filter((u) => typeof u === 'string');
  }

  return [];
}
