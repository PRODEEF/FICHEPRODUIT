import type { CatalogProduct } from '@types-api';

/** Compare deux produits : catégorie α → sous-catégorie α → prix décroissant. */
export function compareCatalogProducts(a: CatalogProduct, b: CatalogProduct): number {
  const byCategory = a.category.localeCompare(b.category, 'fr', { sensitivity: 'base' });
  if (byCategory !== 0) return byCategory;

  const subA = a.subCategory?.trim() ?? '';
  const subB = b.subCategory?.trim() ?? '';
  const bySubCategory = subA.localeCompare(subB, 'fr', { sensitivity: 'base' });
  if (bySubCategory !== 0) return bySubCategory;

  return b.price - a.price;
}

export function sortCatalogProducts(products: CatalogProduct[]): CatalogProduct[] {
  return [...products].sort(compareCatalogProducts);
}
