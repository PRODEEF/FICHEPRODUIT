/**
 * Normalise une URL de boutique pour la comparer sans tenir compte
 * du schéma (http/https), du préfixe www ou du slash final.
 * Miroir de la normalisation appliquée côté backend.
 */
export function normalizeShopUrlForComparison(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return '';

  // Force https
  let withScheme = trimmed;
  if (!/^https?:\/\//i.test(withScheme)) {
    withScheme = 'https://' + withScheme;
  }
  withScheme = withScheme.replace(/^http:\/\//i, 'https://');

  try {
    const parsed = new URL(withScheme);

    let hostname = parsed.hostname.toLowerCase();
    if (hostname.startsWith('www.')) {
      hostname = hostname.slice(4);
    }

    // Supprime le slash final du chemin
    const pathname = parsed.pathname.replace(/\/+$/, '');

    return `https://${hostname}${pathname}`;
  } catch {
    return trimmed.toLowerCase();
  }
}

/**
 * Retourne true si les deux URLs désignent le même site,
 * indépendamment de http/https, www et du slash final.
 */
export function shopUrlsEquivalent(a: string, b: string): boolean {
  if (!a.trim() || !b.trim()) return false;
  return normalizeShopUrlForComparison(a) === normalizeShopUrlForComparison(b);
}
