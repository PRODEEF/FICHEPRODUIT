import { SHOP_SECTOR_LABELS } from '@shared/lib/shopSectors';

import type { ProductFilter } from '../types';

export type CatalogSelectFilterKey = Exclude<keyof ProductFilter, 'search'>;

export interface CatalogSelectFilterDefinition {
  key: CatalogSelectFilterKey;
  id: string;
  label: string;
  emptyLabel: string;
  optionsSource: 'sectors' | 'categories' | 'subCategories' | 'brands' | 'years';
}

export const CATALOG_SELECT_FILTER_DEFINITIONS: readonly CatalogSelectFilterDefinition[] = [
  {
    key: 'sector',
    id: 'catalog-filter-sector',
    label: 'Secteur',
    emptyLabel: 'Tous',
    optionsSource: 'sectors',
  },
  {
    key: 'category',
    id: 'catalog-filter-category',
    label: 'Catégorie',
    emptyLabel: 'Toutes',
    optionsSource: 'categories',
  },
  {
    key: 'subCategory',
    id: 'catalog-filter-subcategory',
    label: 'Sous-catégorie',
    emptyLabel: 'Toutes',
    optionsSource: 'subCategories',
  },
  {
    key: 'brand',
    id: 'catalog-filter-brand',
    label: 'Marque',
    emptyLabel: 'Toutes',
    optionsSource: 'brands',
  },
  {
    key: 'year',
    id: 'catalog-filter-year',
    label: 'Année',
    emptyLabel: 'Toutes',
    optionsSource: 'years',
  },
] as const;

export function resolveCatalogFilterOptions(
  source: CatalogSelectFilterDefinition['optionsSource'],
  options: {
    brandOptions: string[];
    categoryOptions: string[];
    subCategoryOptions: string[];
    yearOptions: string[];
  },
): string[] {
  switch (source) {
    case 'sectors':
      return [...SHOP_SECTOR_LABELS];
    case 'categories':
      return options.categoryOptions;
    case 'subCategories':
      return options.subCategoryOptions;
    case 'brands':
      return options.brandOptions;
    case 'years':
      return options.yearOptions;
  }
}
