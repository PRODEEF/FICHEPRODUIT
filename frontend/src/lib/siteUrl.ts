/**
 * If the user input is already a URL or bare domain, returns a normalized https URL.
 * Otherwise returns null (free text → needs AI / heuristic suggestions).
 */
export function parseAsSiteUrl(raw: string): string | null {
  const trimmed = String(raw).trim()
  if (!trimmed) return null

  if (/^https?:\/\//i.test(trimmed)) {
    const u = trimmed.replace(/^https?:\/\//i, 'https://').replace(/\/+$/, '')
    try {
      new URL(u)
      return u
    } catch {
      return null
    }
  }

  if (/^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}$/i.test(trimmed)) {
    return `https://${trimmed.replace(/^https?:\/\//i, '')}`
  }

  return null
}
