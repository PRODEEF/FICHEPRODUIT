import type { Shop } from '../types';

/**
 * Indique si le magasin doit encore être configuré via une analyse de site
 * (URL manquante ou fiche non enrichie par une analyse).
 */
export function needsShopSetup(shop: Shop): boolean {
  const noEnrichment = shop.brands.length === 0 && shop.sector === null;
  return !shop.url.trim() || noEnrichment;
}
