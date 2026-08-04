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
  product({
    id: '1',
    name: 'Aile Alpha',
    brand: 'Nike',
    category: 'Kitesurf',
    year: 2024,
    price: 500,
  }),
  product({
    id: '2',
    name: 'Planche Beta',
    brand: 'Adidas',
    category: 'Surf',
    subCategory: 'Shortboards',
    year: 2023,
    price: 300,
  }),
  product({
    id: '3',
    name: 'Aile Gamma',
    brand: 'Nike',
    sector: 'Autres',
    category: 'Kitesurf',
    year: 2024,
    price: 800,
  }),
];

describe('useProductFilters', () => {
  it('propose toutes les marques du shop dans le filtre marque', () => {
    const shopBrands = ['Nike', 'Adidas', 'NeilPryde', 'Fanatic', 'Starboard'];
    const { result } = renderHook(() => useProductFilters(products, null, shopBrands));

    expect(result.current.brandOptions).toEqual([
      'Adidas',
      'Fanatic',
      'NeilPryde',
      'Nike',
      'Starboard',
    ]);
  });

  it('n’applique pas de filtre secteur par défaut', () => {
    const { result } = renderHook(() => useProductFilters(products, null, ['Nike']));

    expect(result.current.filters.sector).toBe('');
    expect(result.current.filteredProducts.map((p) => p.id)).toEqual(['3', '1', '2']);
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

  it('conserve les filtres dépendants quand la catégorie change', () => {
    const { result } = renderHook(() => useProductFilters(products, null));

    act(() => {
      result.current.setFilter('category', 'Kitesurf');
      result.current.setFilter('brand', 'Nike');
    });

    act(() => {
      result.current.setFilter('category', 'Surf');
    });

    expect(result.current.filters.category).toBe('Surf');
    expect(result.current.filters.brand).toBe('Nike');
    expect(result.current.filteredProducts).toHaveLength(0);
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
    expect(result.current.filteredProducts.map((p) => p.id)).toEqual(['3', '1']);
  });

  it('conserve la marque quand on change vers un autre secteur non vide', () => {
    const { result } = renderHook(() => useProductFilters(products, null));

    act(() => {
      result.current.setFilter('brand', 'Nike');
    });

    act(() => {
      result.current.setFilter('sector', 'Vélo');
    });

    expect(result.current.filters.brand).toBe('Nike');
    expect(result.current.filteredProducts).toHaveLength(0);
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

  it('combine catégorie et marque sans effacer les filtres', () => {
    const { result } = renderHook(() => useProductFilters(products, null));

    act(() => {
      result.current.setFilter('sector', 'Glisse');
      result.current.setFilter('category', 'Kitesurf');
      result.current.setFilter('brand', 'Adidas');
    });

    expect(result.current.filters.brand).toBe('Adidas');
    expect(result.current.filters.category).toBe('Kitesurf');
    expect(result.current.filteredProducts).toHaveLength(0);
  });
});
