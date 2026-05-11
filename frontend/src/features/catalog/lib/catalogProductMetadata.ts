import type { CatalogProduct } from '@types-api';

import type { CatalogProductPayloadMetadata } from '../types';

export function buildCatalogProductMetadata(products: CatalogProduct[]): CatalogProductPayloadMetadata {
  const brands = new Set<string>();
  const categories = new Set<string>();
  const subCategories = new Set<string>();
  const years = new Set<string>();

  for (const p of products) {
    if (p.brand.trim()) brands.add(p.brand.trim());
    if (p.category.trim()) categories.add(p.category.trim());
    if (p.subCategory?.trim()) subCategories.add(p.subCategory.trim());
    if (p.year) years.add(String(p.year));
  }

  const sort = (values: Set<string>) => [...values].sort((a, b) => a.localeCompare(b, 'fr'));

  return {
    brands: sort(brands),
    categories: sort(categories),
    subCategories: sort(subCategories),
    years: sort(years),
  };
}
