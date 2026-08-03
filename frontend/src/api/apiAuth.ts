/**
 * Helpers pour construire les headers HTTP vers le backend NestJS.
 *
 * - Authentifié : `Authorization: Bearer <supabase_access_token>`
 * - Invité      : cookie httpOnly `ficheproduct_guest_session` + en-tête `x-session-id`
 *                 (secours cross-origin lorsque le cookie n'est pas renvoyé).
 *
 * Tous les appels API utilisent `credentials: 'include'` (voir `apiFetch`).
 */

import { getOrCreateGuestSessionId } from '@lib/analysis/guestSessionStorage';
import { getSupabaseClient } from '@shared/supabase';

type ApiHeaders = Record<string, string>;

function omitContentType(headers: ApiHeaders): ApiHeaders {
  const result: ApiHeaders = {};
  for (const [key, value] of Object.entries(headers)) {
    if (key !== 'Content-Type') {
      result[key] = value;
    }
  }
  return result;
}

/**
 * Headers de base : Content-Type JSON + Bearer si session Supabase active.
 */
export async function authHeaders(accessTokenOverride?: string): Promise<ApiHeaders> {
  const headers: ApiHeaders = { 'Content-Type': 'application/json' };

  const token = accessTokenOverride?.trim();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    return headers;
  }

  const supabase = getSupabaseClient();
  if (supabase) {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }
  }

  return headers;
}

/**
 * Headers pour les routes à auth optionnelle (analyses, catalogue, etc.) :
 * Bearer si session Supabase + toujours `x-session-id` (JWT prioritaire côté backend ;
 * si le token est ignoré, le parcours invité reste cohérent entre POST et poll).
 */
export async function guestOrAuthHeaders(): Promise<ApiHeaders> {
  const headers = await authHeaders();
  headers['x-session-id'] = getOrCreateGuestSessionId();
  return headers;
}

/**
 * Headers pour requêtes sans corps JSON (GET, DELETE).
 */
export async function authHeadersNoBody(): Promise<ApiHeaders> {
  const h = await authHeaders();
  return omitContentType(h);
}

/** GET/DELETE invité ou connecté — sans `Content-Type`. */
export async function guestOrAuthHeadersNoBody(): Promise<ApiHeaders> {
  const h = await guestOrAuthHeaders();
  return omitContentType(h);
}

/** Erreur HTTP renvoyée par {@link apiFetch} lorsque `response.ok` est faux. */
export class ApiHttpError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiHttpError';
    this.status = status;
  }
}

export function extractErrorMessage(parsed: unknown, fallback: string): string {
  if (typeof parsed === 'object' && parsed !== null) {
    const o = parsed as Record<string, unknown>;
    if (typeof o['message'] === 'string' && o['message'].trim()) return o['message'].trim();

    if (Array.isArray(o['message']) && typeof o['message'][0] === 'string') return o['message'][0];
  }
  return fallback;
}

/**
 * Wrapper fetch avec `credentials: 'include'` pour les cookies invité.
 */
export async function apiFetch(
  url: string,
  init: RequestInit,
): Promise<{ res: Response; parsed: unknown }> {
  const res = await fetch(url, { ...init, credentials: 'include' });
  const text = await res.text();

  let parsed: unknown = null;
  if (text.length > 0) {
    try {
      parsed = JSON.parse(text);
    } catch {
      if (!res.ok)
        throw new ApiHttpError(`Réponse non-JSON du serveur (${res.status}).`, res.status);
    }
  }

  if (!res.ok) {
    const status = res.status;

    if (status === 401)
      throw new ApiHttpError(
        extractErrorMessage(parsed, 'Session expirée ou non autorisée. Reconnecte-toi.'),
        401,
      );
    if (status === 403) throw new ApiHttpError(extractErrorMessage(parsed, 'Accès refusé.'), 403);
    if (status === 404)
      throw new ApiHttpError(extractErrorMessage(parsed, 'Ressource introuvable.'), 404);

    throw new ApiHttpError(extractErrorMessage(parsed, `Erreur serveur (${status}).`), status);
  }

  return { res, parsed };
}
