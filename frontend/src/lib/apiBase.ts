/**
 * Single source for API base URL: same rules as vite.config.ts (loadEnv + this helper).
 */
export function normalizeApiBaseUrl(raw: string | undefined): string {
  const t = typeof raw === 'string' ? raw.trim() : ''
  const base = t.length > 0 ? t : 'http://localhost:3000'
  return base.replace(/\/+$/, '')
}

export function getApiBaseUrl(): string {
  return normalizeApiBaseUrl(import.meta.env.VITE_API_URL)
}
