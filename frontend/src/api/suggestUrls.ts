/**
 * Client API — Suggest URLs
 *
 * Route NestJS : POST /api/suggest-urls  (Bearer optionnel ; quota plus élevé si connecté)
 *
 * Prend un hint textuel ("Décathlon", "shop kitesurf bordelais") et retourne
 * une liste d'URLs de sites e-commerce candidates.
 */

import type { SuggestUrlsBody, SuggestUrlsResponse } from '@types-api';

import { getSupabaseSessionAuthHeaders, requestNestJson } from './nestHttpClient';
import { asRecord, readStringArray } from './parseJsonFields';

/**
 * Demande des suggestions d'URLs pour une saisie libre.
 *
 * @param q - Texte saisi par l'utilisateur (nom de marque, description, etc.)
 * @returns Tableau d'URLs (peut être vide si aucun résultat).
 * @throws {ApiError} si la requête HTTP échoue.
 */
export async function fetchSuggestUrls(q: string): Promise<string[]> {
  const body: SuggestUrlsBody = { q: q.trim() };

  const data = await requestNestJson<SuggestUrlsResponse>({
    method: 'POST',
    path: '/suggest-urls',
    body,
    authHeaders: getSupabaseSessionAuthHeaders,
  });

  const o = asRecord(data);
  if (!o) return [];
  return readStringArray(o['urls']);
}
