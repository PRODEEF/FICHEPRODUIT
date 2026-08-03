export function formatPrice(price: number | null): string {
  if (price == null || Number.isNaN(price)) return '—';

  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(price);
}

export function uniqueSorted(values: Iterable<string>): string[] {
  const seen = new Set<string>();
  for (const v of values) {
    const t = v.trim();
    if (t) seen.add(t);
  }
  return [...seen].sort((a, b) => a.localeCompare(b, 'fr'));
}

/**
 * Déduplique sans tenir compte de la casse (conserve la première occurrence),
 * puis trie avec `localeCompare` fr (insensible à la casse).
 */
export function uniqueSortedCaseInsensitive(values: Iterable<string>): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const v of values) {
    const t = v.trim();
    if (!t) continue;
    const key = t.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(t);
  }
  return result.sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }));
}
