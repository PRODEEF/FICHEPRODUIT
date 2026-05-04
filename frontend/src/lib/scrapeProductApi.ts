import type { components } from '../generated/api';
import { getApiBaseUrl } from './apiBase';

export type ScrapeProductResponse = components['schemas']['ScrapeProductResponse'];

/**
 * Appelle `/api/scrape-product` avec le jeton d’accès utilisateur courant.
 *
 * @throws {Error} message issu du corps JSON si présent, sinon statut HTTP.
 */
export async function scrapeProductPage(
  url: string,
  accessToken: string,
): Promise<ScrapeProductResponse> {
  const res = await fetch(`${getApiBaseUrl()}/api/scrape-product`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ url }),
  });

  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const j = (await res.json()) as { message?: string };
      if (typeof j.message === 'string') message = j.message;
    } catch {
      /* corps non JSON ou illisible : conserver le message HTTP par défaut */
    }
    throw new Error(message);
  }

  return res.json() as Promise<ScrapeProductResponse>;
}
