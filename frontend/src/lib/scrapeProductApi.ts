import type { components } from '../generated/api'
import { getApiBaseUrl } from './apiBase'

export type ScrapeProductResponse = components['schemas']['ScrapeProductResponse']

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
  })

  if (!res.ok) {
    let message = `HTTP ${res.status}`
    try {
      const j = (await res.json()) as { message?: string }
      if (typeof j.message === 'string') message = j.message
    } catch {
      /* ignore */
    }
    throw new Error(message)
  }

  return res.json() as Promise<ScrapeProductResponse>
}
