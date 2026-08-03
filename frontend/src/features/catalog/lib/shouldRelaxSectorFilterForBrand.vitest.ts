import { describe, expect, it } from 'vitest';

import type { CatalogProduct } from '@types-api';

import { shouldRelaxSectorFilterForBrand } from './shouldRelaxSectorFilterForBrand';

function product(overrides: Partial<CatalogProduct>): CatalogProduct {
  return {
    id: 'p1',
    name: 'Produit',
    brand: 'Nike',
    sector: 'Glisse',
    category: 'Kitesurf',
    subCategory: 'Ailes',
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

describe('shouldRelaxSectorFilterForBrand', () => {
  it('retourne true si la marque n’a que des produits hors-secteur', () => {
    const products = [
      product({ id: '1', brand: 'Nike', sector: 'Autres' }),
      product({ id: '2', brand: 'Adidas', sector: 'Glisse' }),
    ];
    expect(shouldRelaxSectorFilterForBrand('Nike', 'Glisse', 0, products)).toBe(true);
  });

  it('retourne false s’il reste des résultats filtrés', () => {
    const products = [product({ id: '1', brand: 'Nike', sector: 'Autres' })];
    expect(shouldRelaxSectorFilterForBrand('Nike', 'Glisse', 1, products)).toBe(false);
  });

  it('retourne false si la marque a aussi des produits dans le secteur', () => {
    const products = [
      product({ id: '1', brand: 'Nike', sector: 'Glisse' }),
      product({ id: '2', brand: 'Nike', sector: 'Autres' }),
    ];
    expect(shouldRelaxSectorFilterForBrand('Nike', 'Glisse', 0, products)).toBe(false);
  });

  it('retourne false sans marque ou sans secteur', () => {
    const products = [product({ id: '1', brand: 'Nike', sector: 'Autres' })];
    expect(shouldRelaxSectorFilterForBrand('', 'Glisse', 0, products)).toBe(false);
    expect(shouldRelaxSectorFilterForBrand('Nike', '', 0, products)).toBe(false);
  });
});
