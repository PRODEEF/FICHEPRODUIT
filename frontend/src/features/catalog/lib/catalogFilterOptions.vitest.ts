import { describe, expect, it } from 'vitest';

import type { CatalogProduct } from '@types-api';

import {
  buildBrandOptions,
  buildCategoryOptions,
  buildSubCategoryOptions,
  buildYearOptions,
  findOptionCaseInsensitive,
  getProductsForFilterScope,
  optionIncludedCaseInsensitive,
} from './catalogFilterOptions';

function product(overrides: Partial<CatalogProduct>): CatalogProduct {
  return {
    id: 'p1',
    name: 'Produit',
    brand: 'Brand',
    sector: 'Glisse',
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

const sampleProducts = [
  product({
    id: '1',
    brand: 'SurfCo',
    sector: 'Glisse',
    category: 'Voiles',
    subCategory: 'Freestyle',
    year: 2024,
  }),
  product({
    id: '2',
    brand: 'SurfCo',
    sector: 'Glisse',
    category: 'Planches',
    subCategory: 'Wave',
    year: 2023,
  }),
  product({
    id: '3',
    brand: 'GardenPro',
    sector: 'Jardin',
    category: 'Jardinage',
    subCategory: 'Outils',
    year: 2024,
  }),
];

const emptyParents = { sector: '', category: '', subCategory: '', brand: '' };

describe('getProductsForFilterScope', () => {
  it('restreint par secteur pour les options catégorie', () => {
    const scoped = getProductsForFilterScope(
      sampleProducts,
      { sector: 'Glisse', category: '', subCategory: '', brand: '' },
      'category',
    );
    expect(scoped).toHaveLength(2);
    expect(scoped.every((p) => p.sector === 'Glisse')).toBe(true);
  });
});

describe('buildCategoryOptions', () => {
  it('ne propose que les catégories du secteur sélectionné', () => {
    const options = buildCategoryOptions(sampleProducts, {
      sector: 'Glisse',
      category: '',
      subCategory: '',
      brand: '',
    });
    expect(options).toEqual(['Planches', 'Voiles']);
  });

  it('inclut toutes les catégories sans filtre secteur', () => {
    const options = buildCategoryOptions(sampleProducts, emptyParents);
    expect(options).toEqual(['Jardinage', 'Planches', 'Voiles']);
  });
});

describe('buildSubCategoryOptions', () => {
  it('restreint par secteur et catégorie', () => {
    const options = buildSubCategoryOptions(sampleProducts, {
      sector: 'Glisse',
      category: 'Voiles',
      subCategory: '',
      brand: '',
    });
    expect(options).toEqual(['Freestyle']);
  });
});

describe('buildBrandOptions', () => {
  it('restreint par secteur, catégorie et sous-catégorie', () => {
    const options = buildBrandOptions(sampleProducts, {
      sector: 'Glisse',
      category: 'Planches',
      subCategory: 'Wave',
      brand: '',
    });
    expect(options).toEqual(['SurfCo']);
  });

  it('exclut les marques hors périmètre secteur', () => {
    const options = buildBrandOptions(sampleProducts, {
      sector: 'Glisse',
      category: 'Voiles',
      subCategory: '',
      brand: '',
    });
    expect(options).not.toContain('GardenPro');
  });
});

describe('buildYearOptions', () => {
  it('restreint par secteur, catégorie, sous-catégorie et marque', () => {
    const options = buildYearOptions(sampleProducts, {
      sector: 'Glisse',
      category: 'Planches',
      subCategory: 'Wave',
      brand: 'SurfCo',
    });
    expect(options).toEqual(['2023']);
  });
});

describe('comparaison secteur insensible à la casse', () => {
  it('filtre le secteur sans tenir compte de la casse', () => {
    const options = buildCategoryOptions(sampleProducts, {
      sector: 'glisse',
      category: '',
      subCategory: '',
      brand: '',
    });
    expect(options).toEqual(['Planches', 'Voiles']);
  });
});

describe('findOptionCaseInsensitive', () => {
  it('retrouve une option malgré une casse différente', () => {
    expect(findOptionCaseInsensitive(['Salomon', 'Nike'], 'salomon')).toBe('Salomon');
  });

  it('retourne undefined si aucune correspondance', () => {
    expect(findOptionCaseInsensitive(['Salomon'], 'Adidas')).toBeUndefined();
  });
});

describe('optionIncludedCaseInsensitive', () => {
  it('valide la présence sans tenir compte de la casse', () => {
    expect(optionIncludedCaseInsensitive(['Salomon'], 'SALOMON')).toBe(true);
    expect(optionIncludedCaseInsensitive(['Salomon'], 'Adidas')).toBe(false);
  });
});
