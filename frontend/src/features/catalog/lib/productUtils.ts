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
