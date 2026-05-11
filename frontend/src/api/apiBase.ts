export function normalizeApiBaseUrl(raw: string | undefined): string {
  const t = typeof raw === 'string' ? raw.trim() : '';
  const base = t.length > 0 ? t : 'http://localhost:3000';
  return base.replace(/\/+$/, '');
}

/**
 * URL de base pour les appels API.
 * - Si `VITE_API_URL` est vide ou absent : chaîne vide → URLs relatives `/api/...` (proxy Vite en dev, même origine en prod).
 * - Sinon : URL absolue normalisée (sans slash final).
 */
export function getApiBaseUrl(): string {
  const raw = import.meta.env['VITE_API_URL'];
  if (raw === undefined || String(raw).trim() === '') {
    return '';
  }
  return normalizeApiBaseUrl(String(raw));
}
