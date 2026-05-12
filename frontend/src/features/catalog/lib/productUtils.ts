import type { CmsType } from '@types-api';

export function formatPrice(price: number | null): string {
  if (price == null || Number.isNaN(price)) return '—';

  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(price);
}

export function formatCmsLabel(cms: CmsType | null): string {
  if (!cms) return 'Inconnu';

  const map: Record<CmsType, string> = {
    prestashop: 'PrestaShop',
    shopify: 'Shopify',
    woocommerce: 'WooCommerce',
    autre: 'Autre',
    inconnu: 'Inconnu',
    other: 'Autre',
    unknown: 'Inconnu',
  };
  return map[cms];
}

export function uniqueSorted(values: Iterable<string>): string[] {
  const seen = new Set<string>();
  for (const v of values) {
    const t = v.trim();
    if (t) seen.add(t);
  }
  return [...seen].sort((a, b) => a.localeCompare(b, 'fr'));
}
