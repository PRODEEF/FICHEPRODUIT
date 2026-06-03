import type { ProductFilter } from '../types';

/** Valeur secteur utilisée quand la boutique n’a pas de secteur configuré. */
export function resolveDefaultShopSector(raw: string | null | undefined): string {
  return raw?.trim() ?? '';
}

/** État filtre initial / après réinitialisation (secteur = celui de la boutique si défini). */
export function createCatalogDefaultFilters(defaultSector: string): ProductFilter {
  return {
    search: '',
    sector: defaultSector,
    category: '',
    subCategory: '',
    brand: '',
    year: '',
  };
}
