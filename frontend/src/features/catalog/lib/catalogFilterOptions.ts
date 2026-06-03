import type { CatalogProduct } from '@types-api';

import type { ProductFilter } from '../types';
import { uniqueSorted } from './productUtils';

export type CatalogFilterOptionTarget = 'category' | 'subCategory' | 'brand' | 'year';

export type CatalogFilterParentFilters = Pick<
  ProductFilter,
  'sector' | 'category' | 'subCategory' | 'brand'
>;

function matchesSector(product: CatalogProduct, sector: string): boolean {
  return product.sector.trim().toLowerCase() === sector.trim().toLowerCase();
}

function matchesBrand(product: CatalogProduct, brand: string): boolean {
  return product.brand.toLowerCase() === brand.toLowerCase();
}

/**
 * Retourne les produits servant de base aux options d’un select,
 * selon les filtres parents (cascade secteur → catégorie → sous-catégorie → marque).
 */
export function getProductsForFilterScope(
  products: CatalogProduct[],
  filters: CatalogFilterParentFilters,
  target: CatalogFilterOptionTarget,
): CatalogProduct[] {
  let scoped = products;

  if (filters.sector.trim()) {
    scoped = scoped.filter((p) => matchesSector(p, filters.sector));
  }

  if (target === 'category') {
    return scoped;
  }

  if (filters.category.trim()) {
    scoped = scoped.filter((p) => p.category === filters.category);
  }

  if (target === 'subCategory') {
    return scoped;
  }

  if (filters.subCategory.trim()) {
    scoped = scoped.filter((p) => p.subCategory === filters.subCategory);
  }

  if (target === 'brand') {
    return scoped;
  }

  if (filters.brand.trim()) {
    scoped = scoped.filter((p) => matchesBrand(p, filters.brand));
  }

  return scoped;
}

export function buildCategoryOptions(
  products: CatalogProduct[],
  filters: CatalogFilterParentFilters,
): string[] {
  const scoped = getProductsForFilterScope(products, filters, 'category');
  return uniqueSorted(scoped.map((p) => p.category).filter(Boolean));
}

export function buildSubCategoryOptions(
  products: CatalogProduct[],
  filters: CatalogFilterParentFilters,
): string[] {
  const scoped = getProductsForFilterScope(products, filters, 'subCategory');
  return uniqueSorted(
    scoped.map((p) => p.subCategory).filter((sc): sc is string => Boolean(sc?.trim())),
  );
}

export function buildBrandOptions(
  products: CatalogProduct[],
  filters: CatalogFilterParentFilters,
): string[] {
  const scoped = getProductsForFilterScope(products, filters, 'brand');
  return uniqueSorted(scoped.map((p) => p.brand).filter(Boolean));
}

export function buildYearOptions(
  products: CatalogProduct[],
  filters: CatalogFilterParentFilters,
): string[] {
  const scoped = getProductsForFilterScope(products, filters, 'year');
  return uniqueSorted(scoped.map((p) => String(p.year)).filter(Boolean));
}
