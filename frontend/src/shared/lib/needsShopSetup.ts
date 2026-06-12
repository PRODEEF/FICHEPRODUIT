export interface ShopSetupInput {
  url: string;
  brands: string[];
}

/**
 * Indique si le magasin doit encore être configuré via une analyse de site
 * (URL manquante ou fiche non enrichie par une analyse).
 */
export function needsShopSetup(shop: ShopSetupInput): boolean {
  const noEnrichment = shop.brands.length === 0;
  return !shop.url.trim() || noEnrichment;
}
