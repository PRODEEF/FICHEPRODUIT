import { getSupabaseClient } from '@shared/supabase';

import { ApiError, fetchOrNetworkError } from './apiError';
import { getApiBaseUrl } from './apiBase';

export type NestHttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

async function parseResponseBody(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text.length) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    if (!res.ok) return text;
    throw new Error('Non-JSON response from server.');
  }
}

function resolveRequestUrl(path: string | undefined, absoluteUrl: string | undefined): string {
  if (absoluteUrl !== undefined && absoluteUrl.length > 0) {
    if (/^https?:\/\//i.test(absoluteUrl)) {
      return absoluteUrl;
    }
    return new URL(absoluteUrl, window.location.origin).toString();
  }
  if (path !== undefined && path.length > 0) {
    const base = getApiBaseUrl();
    const p = path.startsWith('/') ? path : `/${path}`;
    return `${base}/api${p}`;
  }
  throw new Error('requestNestJson: `path` or `absoluteUrl` is required.');
}

export interface RequestNestJsonOptions {
  method: NestHttpMethod;
  /** Chemin relatif à `getApiBaseUrl()`, ex. `/analyses`. */
  path?: string;
  /** URL absolue ou relative au origin (comme pour suggest-urls override). */
  absoluteUrl?: string;
  body?: unknown;
  /** Fusionnés en premier ; typiquement `Content-Type` + `Authorization` session. */
  authHeaders?: () => Promise<Record<string, string>>;
  /** Ajoute `Authorization: Bearer …` si défini. */
  bearerToken?: string;
  /** Headers statiques (ex. POST JSON sans auth). */
  headers?: Record<string, string>;
}

/**
 * Client HTTP unique pour le backend Nest : une requête, parse JSON, lève {@link ApiError} si `!res.ok`.
 * @throws {ApiError} si `!res.ok`
 * @throws {NetworkError} si échec réseau
 * @throws {DOMException} AbortError si la requête est annulée
 */
export async function requestNestJson<T>(options: RequestNestJsonOptions): Promise<T> {
  const url = resolveRequestUrl(options.path, options.absoluteUrl);
  const method = options.method;

  const merged: Record<string, string> = {
    ...(options.authHeaders ? await options.authHeaders() : {}),
    ...options.headers,
  };

  if (options.bearerToken) {
    merged['Authorization'] = `Bearer ${options.bearerToken}`;
  }

  if (options.body !== undefined) {
    const hasCt = Object.keys(merged).some((k) => k.toLowerCase() === 'content-type');
    if (!hasCt) {
      merged['Content-Type'] = 'application/json';
    }
  }

  const init: RequestInit = {
    method,
    headers: merged,
    credentials: 'include',
  };
  if (options.body !== undefined) {
    init.body = JSON.stringify(options.body);
  }

  const res = await fetchOrNetworkError(url, init);
  const parsed = await parseResponseBody(res);

  if (!res.ok) {
    throw ApiError.from(res.status, parsed, { url, method });
  }

  return parsed as T;
}

/** Headers JSON + Bearer optionnel depuis la session Supabase (endpoints `/analyses`, etc.). */
export async function getSupabaseSessionAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
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
