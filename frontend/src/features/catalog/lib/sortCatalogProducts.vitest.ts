import { describe, expect, it } from 'vitest';

import type { CatalogProduct } from '@types-api';

import { compareCatalogProducts, sortCatalogProducts } from './sortCatalogProducts';

function product(overrides: Partial<CatalogProduct>): CatalogProduct {
  return {
    id: 'p1',
    name: 'Produit',
    brand: 'Brand',
    sector: 'Glisse',
    category: 'Kitesurf',
    subCategory: 'Ailes',
    year: 2024,
    price: 100,
    description: 'desc',
    detailedDescription: '',
    images: [],
    url: 'https://example.com/p1',
    attributes: {},
    ...overrides,
  };
}

describe('compareCatalogProducts', () => {
  it('trie par catégorie puis sous-catégorie puis prix décroissant', () => {
    const products = [
      product({ id: '1', category: 'Surf', subCategory: 'Shortboards', price: 200 }),
      product({ id: '2', category: 'Kitesurf', subCategory: 'Planches', price: 300 }),
      product({ id: '3', category: 'Kitesurf', subCategory: 'Ailes', price: 500 }),
      product({ id: '4', category: 'Kitesurf', subCategory: 'Ailes', price: 800 }),
      product({ id: '5', category: 'Surf', subCategory: 'Longboards', price: 100 }),
    ];

    expect(sortCatalogProducts(products).map((p) => p.id)).toEqual(['4', '3', '2', '5', '1']);
  });

  it('traite les sous-catégories nulles comme chaîne vide', () => {
    const a = product({ id: 'a', category: 'X', subCategory: null, price: 10 });
    const b = product({ id: 'b', category: 'X', subCategory: 'Y', price: 10 });
    expect(compareCatalogProducts(a, b)).toBeLessThan(0);
  });
});
