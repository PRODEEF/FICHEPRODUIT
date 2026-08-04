/**
 * Erreurs HTTP / réseau du client API.
 *
 * - {@link ApiError} : réponse HTTP non OK (status, body brut, url, method).
 * - {@link NetworkError} : échec sans status (réseau, DNS, CORS…).
 * - {@link AbortError} : laisser remonter tel quel — jamais comme erreur UI.
 *
 * Les messages français UI sont dans `@lib/apiErrorMessage`.
 */

const API_ERROR_MARKER = '__ficheproductApiError' as const;
const NETWORK_ERROR_MARKER = '__ficheproductNetworkError' as const;

export type ApiHttpMethod = string;

export interface ApiErrorInit {
  body?: unknown;
  url?: string;
  method?: ApiHttpMethod;
}

/**
 * Erreur HTTP renvoyée par `apiFetch` / `requestNestJson`.
 * `message` = message serveur brut (jamais de texte UI localisé).
 */
export class ApiError extends Error {
  readonly [API_ERROR_MARKER] = true as const;
  readonly status: number;
  readonly body?: unknown;
  readonly url?: string;
  readonly method?: ApiHttpMethod;

  constructor(status: number, message: string, init?: ApiErrorInit) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    if (init?.body !== undefined) this.body = init.body;
    if (init?.url !== undefined) this.url = init.url;
    if (init?.method !== undefined) this.method = init.method;
  }

  /**
   * Construit une {@link ApiError} depuis un status HTTP et un corps optionnel.
   * Sur 5xx : logue le message serveur brut (peut contenir une stack Nest) ;
   * le mapping UI ignore ce message (voir `apiErrorMessage`).
   */
  static from(status: number, body?: unknown, init?: Omit<ApiErrorInit, 'body'>): ApiError {
    const rawMessage = extractRawServerMessage(body);

    if (status >= 500 && rawMessage) {
      console.error('[ApiError] message serveur 5xx (non affiché) :', rawMessage, body);
    }

    return new ApiError(status, rawMessage, {
      body,
      ...(init?.url !== undefined ? { url: init.url } : {}),
      ...(init?.method !== undefined ? { method: init.method } : {}),
    });
  }
}

/**
 * Échec réseau sans status HTTP (offline, DNS, CORS, etc.).
 */
export class NetworkError extends Error {
  readonly [NETWORK_ERROR_MARKER] = true as const;
  readonly url?: string;
  readonly method?: ApiHttpMethod;

  constructor(message: string, init?: { cause?: unknown; url?: string; method?: ApiHttpMethod }) {
    super(message, init?.cause !== undefined ? { cause: init.cause } : undefined);
    this.name = 'NetworkError';
    if (init?.url !== undefined) this.url = init.url;
    if (init?.method !== undefined) this.method = init.method;
  }
}

/** Type guard HMR-safe (évite `instanceof` cassé si le module est dupliqué). */
export function isApiError(e: unknown): e is ApiError {
  return (
    typeof e === 'object' &&
    e !== null &&
    API_ERROR_MARKER in e &&
    (e as Record<string, unknown>)[API_ERROR_MARKER] === true
  );
}

export function isNetworkError(e: unknown): e is NetworkError {
  return (
    typeof e === 'object' &&
    e !== null &&
    NETWORK_ERROR_MARKER in e &&
    (e as Record<string, unknown>)[NETWORK_ERROR_MARKER] === true
  );
}

/** Annulation `fetch` / `AbortController` — ne pas afficher à l’utilisateur. */
export function isAbortError(e: unknown): boolean {
  if (typeof DOMException !== 'undefined' && e instanceof DOMException && e.name === 'AbortError') {
    return true;
  }
  return e instanceof Error && e.name === 'AbortError';
}

/**
 * Extrait le message serveur brut depuis un corps Nest.
 * Si `message` est un tableau, joint tous les éléments (pas seulement le premier).
 */
export function extractRawServerMessage(parsed: unknown): string {
  if (typeof parsed === 'object' && parsed !== null) {
    const o = parsed as Record<string, unknown>;
    const msg = o['message'];
    if (typeof msg === 'string') return msg.trim();
    if (Array.isArray(msg)) {
      return msg
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.trim())
        .filter((item) => item.length > 0)
        .join('; ');
    }
  }
  if (typeof parsed === 'string') return parsed.trim();
  return '';
}

/**
 * Enveloppe un `fetch` : AbortError tel quel, autres échecs → {@link NetworkError}.
 */
export async function fetchOrNetworkError(url: string, init?: RequestInit): Promise<Response> {
  const method = init?.method ?? 'GET';
  try {
    return await fetch(url, init);
  } catch (err) {
    if (isAbortError(err)) throw err;
    throw new NetworkError('Network request failed', {
      cause: err,
      url,
      method,
    });
  }
}
