import { getSupabaseClient } from '@shared/supabase';

import { getApiBaseUrl } from './apiBase';

export type NestHttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * Erreur HTTP renvoyée par l’API Nest après lecture du corps (JSON ou vide).
 * Conserve `status` et `body` pour un mapping métier côté appelant.
 */
export class NestHttpError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = 'NestHttpError';
    this.status = status;
    this.body = body;
  }
}

export function messageFromNestErrorBody(parsed: unknown, fallback: string): string {
  if (!parsed || typeof parsed !== 'object' || !('message' in parsed)) {
    return fallback;
  }
  const m = (parsed as { message: unknown }).message;
  if (typeof m === 'string' && m.trim()) return m.trim();
  if (Array.isArray(m) && m[0] && typeof m[0] === 'string') return String(m[0]);
  return fallback;
}

async function parseResponseJson(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text.length) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new Error('Réponse du serveur non JSON.');
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
  throw new Error('requestNestJson: `path` ou `absoluteUrl` est requis.');
}

export type RequestNestJsonOptions = {
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
};

/**
 * Client HTTP unique pour le backend Nest : une requête, parse JSON, lève {@link NestHttpError} si `!res.ok`.
 */
export async function requestNestJson<T>(options: RequestNestJsonOptions): Promise<T> {
  const url = resolveRequestUrl(options.path, options.absoluteUrl);

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
    method: options.method,
    headers: merged,
  };
  if (options.body !== undefined) {
    init.body = JSON.stringify(options.body);
  }
  const res = await fetch(url, init);

  const parsed = await parseResponseJson(res);

  if (!res.ok) {
    const fallback = `HTTP ${res.status}`;
    throw new NestHttpError(messageFromNestErrorBody(parsed, fallback), res.status, parsed);
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
