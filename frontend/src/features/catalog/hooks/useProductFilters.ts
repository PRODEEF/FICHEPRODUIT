import { useCallback, useMemo, useState } from 'react';

import type { CatalogProduct } from '@types-api';
import { catalogSectorsMatch } from '@shared/lib/shopSectors';

import type { CatalogProductPayloadMetadata, ProductFilter } from '../types';
import { createCatalogDefaultFilters } from '../lib/catalogFilterDefaults';
import {
  buildBrandOptions,
  buildCategoryOptions,
  buildSubCategoryOptions,
  buildYearOptions,
} from '../lib/catalogFilterOptions';
import { sortCatalogProducts } from '../lib/sortCatalogProducts';

interface UseProductFiltersResult {
  filters: ProductFilter;
  setFilter: <K extends keyof ProductFilter>(key: K, value: ProductFilter[K]) => void;
  resetFilters: () => void;
  hasActiveFilters: boolean;
  filteredProducts: CatalogProduct[];
  brandOptions: string[];
  categoryOptions: string[];
  subCategoryOptions: string[];
  yearOptions: string[];
}

export function useProductFilters(
  products: CatalogProduct[],
  _productPayload: CatalogProductPayloadMetadata | null,
  shopBrands?: string[],
): UseProductFiltersResult {
  const [filters, setFilters] = useState<ProductFilter>(() => createCatalogDefaultFilters());

  const setFilter = useCallback(
    <K extends keyof ProductFilter>(key: K, value: ProductFilter[K]) => {
      setFilters((prev) => {
        if (prev[key] === value) {
          return prev;
        }
        return { ...prev, [key]: value };
      });
    },
    [],
  );

  const resetFilters = useCallback(() => {
    setFilters(createCatalogDefaultFilters());
  }, []);

  const parentFilters = useMemo(
    () => ({
      sector: filters.sector,
      category: filters.category,
      subCategory: filters.subCategory,
      brand: filters.brand,
    }),
    [filters.sector, filters.category, filters.subCategory, filters.brand],
  );

  const categoryOptions = useMemo(
    () => buildCategoryOptions(products, parentFilters),
    [products, parentFilters],
  );

  const subCategoryOptions = useMemo(
    () => buildSubCategoryOptions(products, parentFilters),
    [products, parentFilters],
  );

  const brandOptions = useMemo(() => {
    const fromScope = buildBrandOptions(products, parentFilters);
    if (shopBrands === undefined) {
      return fromScope;
    }
    const shopLower = new Set(shopBrands.map((b) => b.trim().toLowerCase()).filter(Boolean));
    if (shopLower.size === 0) {
      return fromScope;
    }
    return fromScope.filter((b) => shopLower.has(b.toLowerCase()));
  }, [products, parentFilters, shopBrands]);

  const yearOptions = useMemo(
    () => buildYearOptions(products, parentFilters),
    [products, parentFilters],
  );

  const filteredProducts = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    const filtered = products.filter((p) => {
      if (filters.sector && !catalogSectorsMatch(p.sector, filters.sector)) return false;
      if (filters.category && p.category !== filters.category) return false;
      if (filters.subCategory && p.subCategory !== filters.subCategory) return false;
      if (filters.brand && p.brand.toLowerCase() !== filters.brand.toLowerCase()) return false;
      if (filters.year && String(p.year) !== filters.year) return false;
      if (q) {
        const haystack = [p.sector, p.brand, p.category, p.subCategory, p.name, p.description]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
    return sortCatalogProducts(filtered);
  }, [products, filters]);

  const hasActiveFilters = useMemo(
    () =>
      Boolean(
        filters.search.trim() ||
        filters.sector ||
        filters.category ||
        filters.subCategory ||
        filters.brand ||
        filters.year,
      ),
    [filters],
  );

  return {
    filters,
    setFilter,
    resetFilters,
    hasActiveFilters,
    filteredProducts,
    brandOptions,
    categoryOptions,
    subCategoryOptions,
    yearOptions,
  };
}
