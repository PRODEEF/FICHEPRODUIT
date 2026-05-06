import type { components } from '../../../generated/api';

import { getApiBaseUrl } from '@lib/api/apiBase';

// ─── Types ────────────────────────────────────────────────────────────────────

export type RefineTemplateFieldsRequest = components['schemas']['RefineTemplateFieldsRequest'];
export type RefineTemplateFieldsResponse = components['schemas']['RefineTemplateFieldsResponse'];
export type ScrapeProductResponse = components['schemas']['ScrapeProductResponse'];

// ─── Shared helper ────────────────────────────────────────────────────────────

async function apiPost<T>(path: string, body: unknown, accessToken: string): Promise<T> {
  const res = await fetch(`${getApiBaseUrl()}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const j = (await res.json()) as { message?: string | string[] };
      if (typeof j.message === 'string') message = j.message;
      else if (Array.isArray(j.message) && j.message[0]) message = String(j.message[0]);
    } catch {
      /* corps non JSON : conserver le message HTTP par défaut */
    }
    throw new Error(message);
  }

  return res.json() as Promise<T>;
}

// ─── API functions ────────────────────────────────────────────────────────────

export function refineTemplateFields(
  body: RefineTemplateFieldsRequest,
  accessToken: string,
): Promise<RefineTemplateFieldsResponse> {
  return apiPost('/api/refine-template-fields', body, accessToken);
}

export function scrapeProductPage(
  url: string,
  accessToken: string,
): Promise<ScrapeProductResponse> {
  return apiPost('/api/scrape-product', { url }, accessToken);
}
