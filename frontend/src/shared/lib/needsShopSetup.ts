export interface ShopSetupInput {
  url: string;
  brands: string[];
  /** CMS détecté — `inconnu` / absent = pas encore enrichi par analyse. */
  cms?: string | null;
  /** Arbre catégories issu de l’analyse ou saisi manuellement. */
  categoryTree?: unknown[] | null;
}

/**
 * Indique si le magasin doit encore être configuré via une analyse de site
 * (URL manquante ou fiche non enrichie : pas de marques, CMS inconnu, pas de catégories).
 */
export function needsShopSetup(shop: ShopSetupInput): boolean {
  if (!shop.url.trim()) return true;

  const hasBrands = shop.brands.length > 0;
  const cms = (shop.cms ?? '').trim().toLowerCase();
  const hasCms = cms.length > 0 && cms !== 'inconnu' && cms !== 'unknown' && cms !== 'other';
  const hasCategories = Array.isArray(shop.categoryTree) && shop.categoryTree.length > 0;

  return !hasBrands && !hasCms && !hasCategories;
}
