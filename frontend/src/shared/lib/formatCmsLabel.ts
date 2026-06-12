import type { CmsType } from '@types-api';

const CMS_LABELS: Record<CmsType, string> = {
  prestashop: 'PrestaShop',
  shopify: 'Shopify',
  woocommerce: 'WooCommerce',
  autre: 'Autre',
  inconnu: 'Inconnu',
  other: 'Autre',
  unknown: 'Inconnu',
};

/** Libellé affichable pour un type de CMS détecté. */
export function formatCmsLabel(cms: CmsType | null): string {
  if (!cms) return 'Inconnu';
  return CMS_LABELS[cms];
}
