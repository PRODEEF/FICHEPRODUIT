import type { SiteAnalysis } from '@lib/analysis/analysisApi';

export function formatPrice(price: number | undefined, currency: string): string {
  if (price == null || Number.isNaN(price)) return '—';
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency || 'EUR',
  }).format(price);
}

export function formatCmsLabel(cms: SiteAnalysis['cmsType'] | undefined): string {
  if (!cms || cms === 'unknown') return 'Inconnu';
  const map: Record<string, string> = {
    prestashop: 'PrestaShop',
    shopify: 'Shopify',
    woocommerce: 'WooCommerce',
  };
  return map[cms] ?? cms;
}

export function uniqueSorted(values: Iterable<string>): string[] {
  const seen = new Set<string>();
  for (const v of values) {
    const t = v.trim();
    if (t) seen.add(t);
  }
  return [...seen].sort((a, b) => a.localeCompare(b, 'fr'));
}
