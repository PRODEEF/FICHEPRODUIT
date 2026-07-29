import { describe, expect, it } from 'vitest';

import type { CatalogProduct } from '@types-api';

import { buildCatalogProductMetadata } from './catalogProductMetadata';

function product(overrides: Partial<CatalogProduct>): CatalogProduct {
  return {
    id: 'p1',
    name: 'Produit',
    brand: 'Brand',
    sector: 'Secteur',
    category: 'Category',
    subCategory: 'Sub',
    year: 2024,
    price: 10,
    description: 'desc',
    detailedDescription: '',
    images: [],
    url: 'https://example.com/p1',
    attributes: {},
    ...overrides,
  };
}

describe('buildCatalogProductMetadata', () => {
  it('déduplique et trie les options', () => {
    const metadata = buildCatalogProductMetadata([
      product({ id: '1', brand: 'Nike', category: 'Shoes', subCategory: 'Running', year: 2024 }),
      product({
        id: '2',
        brand: 'Adidas',
        category: 'Shoes',
        subCategory: 'Lifestyle',
        year: 2023,
      }),
      product({ id: '3', brand: 'Nike', category: 'Apparel', subCategory: null, year: 2024 }),
    ]);

    expect(metadata.brands).toEqual(['Adidas', 'Nike']);
    expect(metadata.categories).toEqual(['Apparel', 'Shoes']);
    expect(metadata.subCategories).toEqual(['Lifestyle', 'Running']);
    expect(metadata.years).toEqual(['2023', '2024']);
  });
});
