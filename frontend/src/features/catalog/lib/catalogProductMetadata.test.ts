import assert from 'node:assert/strict';
import test from 'node:test';

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
    images: [],
    url: 'https://example.com/p1',
    attributes: {},
    ...overrides,
  };
}

void test('buildCatalogProductMetadata déduplique et trie les options', () => {
  const metadata = buildCatalogProductMetadata([
    product({ id: '1', brand: 'Nike', category: 'Shoes', subCategory: 'Running', year: 2024 }),
    product({ id: '2', brand: 'Adidas', category: 'Shoes', subCategory: 'Lifestyle', year: 2023 }),
    product({ id: '3', brand: 'Nike', category: 'Apparel', subCategory: null, year: 2024 }),
  ]);

  assert.deepEqual(metadata.brands, ['Adidas', 'Nike']);
  assert.deepEqual(metadata.categories, ['Apparel', 'Shoes']);
  assert.deepEqual(metadata.subCategories, ['Lifestyle', 'Running']);
  assert.deepEqual(metadata.years, ['2023', '2024']);
});
