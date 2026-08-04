import type { ProductFilter } from '../types';

/** Valeur secteur utilisée quand la boutique n’a pas de secteur configuré. */
export function resolveDefaultShopSector(raw: string | null | undefined): string {
  return raw?.trim() ?? '';
}

/** État filtre initial / après réinitialisation (aucun critère actif). */
export function createCatalogDefaultFilters(): ProductFilter {
  return {
    search: '',
    sector: '',
    category: '',
    subCategory: '',
    brand: '',
    year: '',
  };
}
