// frontend/src/features/home/lib/suggestUrls.ts
import { getApiBaseUrl } from '../../../api/apiBase';
import { requestNestJson } from '../../../api/nestHttpClient';

function trimTrailingSlashes(s: string): string {
  return s.replace(/\/+$/, '');
}

/**
 * Résolution de l’URL du endpoint `suggest-urls` :
 * - `VITE_SUGGEST_URLS_URL` : URL complète imposée ;
 * - sinon : `VITE_API_URL` (voir `apiBase.ts`, défaut aligné avec l’ancienne cible du proxy Vite) + `/api/suggest-urls`.
 */
function suggestEndpoint(): string {
  const override = import.meta.env['VITE_SUGGEST_URLS_URL'];
  if (typeof override === 'string' && override.trim()) {
    return trimTrailingSlashes(override.trim());
  }

  return `${getApiBaseUrl()}/api/suggest-urls`;
}

function resolveUrl(endpoint: string): string {
  if (/^https?:\/\//i.test(endpoint)) {
    return endpoint;
  }
  return new URL(endpoint, window.location.origin).toString();
}

/**
 * Demande des suggestions d’URLs pour une requête libre `q`.
 *
 * @throws {Error} si la réponse HTTP n’est pas OK.
 */
export async function fetchSuggestUrls(q: string): Promise<string[]> {
  const endpoint = resolveUrl(suggestEndpoint());
  const data = await requestNestJson<unknown>({
    method: 'POST',
    absoluteUrl: endpoint,
    body: { q },
  });
  if (
    data &&
    typeof data === 'object' &&
    'urls' in data &&
    Array.isArray((data as { urls: unknown }).urls)
  ) {
    return (data as { urls: string[] }).urls.filter((u) => typeof u === 'string');
  }
  return [];
}
