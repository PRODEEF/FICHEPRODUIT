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
    sector: 'Autres',
    category: 'Kitesurf',
    year: 2024,
  }),
];

describe('useProductFilters', () => {
  it('n’applique pas de filtre secteur par défaut', () => {
    const { result } = renderHook(() => useProductFilters(products, null, ['Nike']));

    expect(result.current.filters.sector).toBe('');
    expect(result.current.filteredProducts.map((p) => p.id)).toEqual(['1', '2', '3']);
    expect(result.current.hasActiveFilters).toBe(false);
  });

  it('filtre par recherche texte', () => {
    const { result } = renderHook(() => useProductFilters(products, null));

    act(() => {
      result.current.setFilter('search', 'planche');
    });

    expect(result.current.filteredProducts.map((p) => p.id)).toEqual(['2']);
    expect(result.current.hasActiveFilters).toBe(true);
  });

  it('réinitialise les filtres dépendants quand la catégorie change', () => {
    const { result } = renderHook(() => useProductFilters(products, null));

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

  it('resetFilters vide tous les critères', () => {
    const { result } = renderHook(() => useProductFilters(products, null));

    act(() => {
      result.current.setFilter('search', 'aile');
      result.current.setFilter('sector', 'Autres');
    });

    act(() => {
      result.current.resetFilters();
    });

    expect(result.current.filters.search).toBe('');
    expect(result.current.filters.sector).toBe('');
    expect(result.current.hasActiveFilters).toBe(false);
  });

  it('filtre les produits du secteur Autres', () => {
    const { result } = renderHook(() => useProductFilters(products, null));

    act(() => {
      result.current.setFilter('sector', 'Autres');
    });

    expect(result.current.filteredProducts.map((p) => p.id)).toEqual(['3']);
  });

  it('conserve la marque quand on passe le secteur à Tous', () => {
    const { result } = renderHook(() => useProductFilters(products, null));

    act(() => {
      result.current.setFilter('brand', 'Nike');
    });

    act(() => {
      result.current.setFilter('sector', '');
    });

    expect(result.current.filters.brand).toBe('Nike');
    expect(result.current.filteredProducts.map((p) => p.id)).toEqual(['1', '3']);
  });

  it('efface la marque quand on change vers un autre secteur non vide', () => {
    const { result } = renderHook(() => useProductFilters(products, null));

    act(() => {
      result.current.setFilter('brand', 'Nike');
    });

    act(() => {
      result.current.setFilter('sector', 'Vélo');
    });

    expect(result.current.filters.brand).toBe('');
  });

  it('conserve le secteur quand marque + secteur ne donnent aucun résultat', () => {
    const { result } = renderHook(() => useProductFilters(products, null));

    act(() => {
      result.current.setFilter('sector', 'Vélo');
      result.current.setFilter('brand', 'Nike');
    });

    expect(result.current.filters.sector).toBe('Vélo');
    expect(result.current.filters.brand).toBe('Nike');
    expect(result.current.filteredProducts).toHaveLength(0);
  });
});
