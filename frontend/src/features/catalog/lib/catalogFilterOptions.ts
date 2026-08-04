import type { CatalogProduct } from '@types-api';
import { catalogSectorsMatch } from '@shared/lib/shopSectors';

import type { ProductFilter } from '../types';
import { uniqueSorted, uniqueSortedCaseInsensitive } from './productUtils';

export type CatalogFilterOptionTarget = 'category' | 'subCategory' | 'brand' | 'year';

export type CatalogFilterParentFilters = Pick<
  ProductFilter,
  'sector' | 'category' | 'subCategory' | 'brand'
>;

function matchesBrand(product: CatalogProduct, brand: string): boolean {
  return product.brand.toLowerCase() === brand.toLowerCase();
}

/**
 * Limite les produits aux marques du magasin.
 * Si le magasin n'a aucune marque configurée, conserve l'ensemble du catalogue.
 */
export function filterProductsByShopBrands(
  products: CatalogProduct[],
  shopBrands?: string[],
): CatalogProduct[] {
  if (shopBrands === undefined) return products;
  const normalized = shopBrands.map((b) => b.trim()).filter(Boolean);
  if (normalized.length === 0) return products;
  const shopLower = new Set(normalized.map((b) => b.toLowerCase()));
  return products.filter((p) => {
    const brand = p.brand.trim();
    return brand.length > 0 && shopLower.has(brand.toLowerCase());
  });
}

/** Retrouve une option dont la valeur correspond sans tenir compte de la casse. */
export function findOptionCaseInsensitive(options: string[], value: string): string | undefined {
  const needle = value.trim().toLowerCase();
  if (!needle) return undefined;
  return options.find((option) => option.trim().toLowerCase() === needle);
}

/** Indique si une valeur figure dans les options, sans tenir compte de la casse. */
export function optionIncludedCaseInsensitive(options: string[], value: string): boolean {
  return findOptionCaseInsensitive(options, value) !== undefined;
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
    scoped = scoped.filter((p) => catalogSectorsMatch(p.sector, filters.sector));
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
  return uniqueSortedCaseInsensitive(scoped.map((p) => p.brand).filter(Boolean));
}

export function buildYearOptions(
  products: CatalogProduct[],
  filters: CatalogFilterParentFilters,
): string[] {
  const scoped = getProductsForFilterScope(products, filters, 'year');
  return uniqueSorted(scoped.map((p) => String(p.year)).filter(Boolean));
}
