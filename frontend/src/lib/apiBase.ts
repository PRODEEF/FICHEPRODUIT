/**
 * Source unique pour l’URL de base de l’API — mêmes règles que `vite.config.ts` (`loadEnv` et cette fonction).
 */
export function normalizeApiBaseUrl(raw: string | undefined): string {
  const t = typeof raw === 'string' ? raw.trim() : '';
  const base = t.length > 0 ? t : 'http://localhost:3000';
  return base.replace(/\/+$/, '');
}

/** URL de base normalisée (sans slash final), lue depuis `import.meta.env.VITE_API_URL`. */
export function getApiBaseUrl(): string {
  return normalizeApiBaseUrl(import.meta.env.VITE_API_URL);
}
