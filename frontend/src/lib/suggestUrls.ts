import { getApiBaseUrl } from './apiBase'

function trimTrailingSlashes(s: string): string {
  return s.replace(/\/+$/, '')
}

/**
 * Resolves the suggest-urls endpoint:
 * - VITE_SUGGEST_URLS_URL: full URL override
 * - else: VITE_API_URL (see apiBase.ts, same default as former vite proxy target) + /api/suggest-urls
 */
function suggestEndpoint(): string {
  const override = import.meta.env.VITE_SUGGEST_URLS_URL
  if (typeof override === 'string' && override.trim()) {
    return trimTrailingSlashes(override.trim())
  }

  return `${getApiBaseUrl()}/api/suggest-urls`
}

function resolveUrl(endpoint: string): string {
  if (/^https?:\/\//i.test(endpoint)) {
    return endpoint
  }
  return new URL(endpoint, window.location.origin).toString()
}

export async function fetchSuggestUrls(q: string): Promise<string[]> {
  const endpoint = resolveUrl(suggestEndpoint())
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ q }),
  })
  if (!res.ok) {
    throw new Error(`Suggest request failed: ${res.status}`)
  }
  const data: unknown = await res.json()
  if (
    data &&
    typeof data === 'object' &&
    'urls' in data &&
    Array.isArray((data as { urls: unknown }).urls)
  ) {
    return (data as { urls: string[] }).urls.filter(
      (u) => typeof u === 'string',
    )
  }
  return []
}
