import { useMemo, useState } from 'react';

import type { Product, ProductListResponse } from '@lib/analysis/analysisApi';

import type { ProductFilter } from '../types';
import { uniqueSorted } from '../lib/productUtils';

export const DEFAULT_FILTERS: ProductFilter = {
  search: '',
  brand: '',
  category: '',
  subCategory: '',
  year: '',
};

type UseProductFiltersResult = {
  filters: ProductFilter;
  setFilter: <K extends keyof ProductFilter>(key: K, value: ProductFilter[K]) => void;
  filteredProducts: Product[];
  brandOptions: string[];
  categoryOptions: string[];
  subCategoryOptions: string[];
  yearOptions: string[];
};

export function useProductFilters(
  products: Product[],
  productPayload: ProductListResponse | null,
): UseProductFiltersResult {
  const [filters, setFilters] = useState<ProductFilter>(DEFAULT_FILTERS);

  const setFilter = <K extends keyof ProductFilter>(key: K, value: ProductFilter[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const brandOptions = useMemo(() => {
    const fromApi = productPayload?.brands ?? [];
    if (fromApi.length) return uniqueSorted(fromApi);
    return uniqueSorted(products.map((p) => p.brand).filter(Boolean) as string[]);
  }, [productPayload?.brands, products]);

  const categoryOptions = useMemo(() => {
    const fromApi = productPayload?.categories ?? [];
    if (fromApi.length) return uniqueSorted(fromApi);
    return uniqueSorted(products.map((p) => p.category).filter(Boolean) as string[]);
  }, [productPayload?.categories, products]);

  const subCategoryOptions = useMemo(() => {
    const fromApi = productPayload?.subCategories ?? [];
    if (fromApi.length) return uniqueSorted(fromApi);
    return uniqueSorted(products.map((p) => p.subCategory).filter(Boolean) as string[]);
  }, [productPayload?.subCategories, products]);

  const yearOptions = useMemo(() => {
    const fromApi = productPayload?.years ?? [];
    if (fromApi.length) return uniqueSorted(fromApi);
    return uniqueSorted(products.map((p) => p.year).filter(Boolean) as string[]);
  }, [productPayload?.years, products]);

  const filteredProducts = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    return products.filter((p) => {
      if (filters.brand && p.brand !== filters.brand) return false;
      if (filters.category && p.category !== filters.category) return false;
      if (filters.subCategory && p.subCategory !== filters.subCategory) return false;
      if (filters.year && p.year !== filters.year) return false;
      if (q) {
        const haystack = [
          p.brand,
          p.category,
          p.subCategory,
          p.title,
          p.description,
          p.commercialDescription,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [products, filters]);

  return { filters, setFilter, filteredProducts, brandOptions, categoryOptions, subCategoryOptions, yearOptions };
}
