// frontend/src/features/home/lib/siteUrl.ts
/**
 * Si la saisie est déjà une URL ou un nom de domaine seul, retourne une URL https normalisée.
 * Sinon retourne `null` (texte libre : recherche Tavily / suggestions heuristiques).
 */
export function parseAsSiteUrl(raw: string): string | null {
  const trimmed = String(raw).trim();
  if (!trimmed) return null;

  if (/^https?:\/\//i.test(trimmed)) {
    const u = trimmed.replace(/^https?:\/\//i, 'https://').replace(/\/+$/, '');
    try {
      new URL(u);
      return u;
    } catch {
      return null;
    }
  }

  if (/^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}$/i.test(trimmed)) {
    return `https://${trimmed.replace(/^https?:\/\//i, '')}`;
  }

  return null;
}

/**
 * Comme une URL complète avec schéma obligatoire : la saisie doit commencer par `http://` ou `https://`.
 * Un domaine seul (« monsite.fr ») est refusé. Utile pour les formulaires qui exigent une vraie URL.
 */
export function parseAsFullSiteUrl(raw: string): string | null {
  const trimmed = String(raw).trim();
  if (!trimmed) return null;

  if (!/^https?:\/\//i.test(trimmed)) return null;

  const u = trimmed.replace(/^https?:\/\//i, 'https://').replace(/\/+$/, '');
  try {
    new URL(u);
    return u;
  } catch {
    return null;
  }
}
