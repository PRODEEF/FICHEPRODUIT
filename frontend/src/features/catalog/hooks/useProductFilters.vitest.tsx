// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { CatalogProduct } from '@types-api';

import { useProductFilters } from './useProductFilters';

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

const products: CatalogProduct[] = [
  product({ id: '1', name: 'Aile Alpha', brand: 'Nike', category: 'Kitesurf', year: 2024 }),
  product({
    id: '2',
    name: 'Planche Beta',
    brand: 'Adidas',
    category: 'Surf',
    subCategory: 'Shortboards',
    year: 2023,
  }),
  product({
    id: '3',
    name: 'Aile Gamma',
    brand: 'Nike',
    sector: 'Autre',
    category: 'Kitesurf',
    year: 2024,
  }),
];

describe('useProductFilters', () => {
  it('filtre par secteur par défaut du magasin', () => {
    const { result } = renderHook(() => useProductFilters(products, null, undefined, 'Glisse'));

    expect(result.current.filters.sector).toBe('Glisse');
    expect(result.current.filteredProducts.map((p) => p.id)).toEqual(['1', '2']);
  });

  it('filtre par recherche texte', () => {
    const { result } = renderHook(() => useProductFilters(products, null, undefined, 'Glisse'));

    act(() => {
      result.current.setFilter('search', 'planche');
    });

    expect(result.current.filteredProducts.map((p) => p.id)).toEqual(['2']);
    expect(result.current.hasActiveFilters).toBe(true);
  });

  it('réinitialise les filtres dépendants quand la catégorie change', () => {
    const { result } = renderHook(() => useProductFilters(products, null, undefined, 'Glisse'));

    act(() => {
      result.current.setFilter('category', 'Kitesurf');
      result.current.setFilter('brand', 'Nike');
    });

    act(() => {
      result.current.setFilter('category', 'Surf');
    });

    expect(result.current.filters.category).toBe('Surf');
    expect(result.current.filters.brand).toBe('');
    expect(result.current.filters.subCategory).toBe('');
  });

  it('resetFilters restaure le secteur par défaut', () => {
    const { result } = renderHook(() => useProductFilters(products, null, undefined, 'Glisse'));

    act(() => {
      result.current.setFilter('search', 'aile');
      result.current.setFilter('sector', 'Autre');
    });

    act(() => {
      result.current.resetFilters();
    });

    expect(result.current.filters.search).toBe('');
    expect(result.current.filters.sector).toBe('Glisse');
    expect(result.current.hasActiveFilters).toBe(false);
  });
});
