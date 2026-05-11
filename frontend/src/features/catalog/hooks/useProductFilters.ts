import { useCallback, useMemo, useState } from 'react';

import type { CatalogProduct } from '@types-api';
import { parseZodFieldErrors } from '@lib/parseZodErrors';

import type { CatalogProductPayloadMetadata, ProductFilter } from '../types';
import { catalogPriceFilterSchema, type CatalogPriceFilterFieldKey } from '../lib/catalogFilterSchemas';
import { uniqueSorted } from '../lib/productUtils';

export const DEFAULT_FILTERS: ProductFilter = {
  search: '',
  brand: '',
  category: '',
  subCategory: '',
  year: '',
  priceMin: '',
  priceMax: '',
};

type UseProductFiltersResult = {
  filters: ProductFilter;
  setFilter: <K extends keyof ProductFilter>(key: K, value: ProductFilter[K]) => void;
  /** Vrai dès qu’au moins un critère (recherche ou filtre structuré) est non vide. */
  hasActiveFilters: boolean;
  filteredProducts: CatalogProduct[];
  brandOptions: string[];
  categoryOptions: string[];
  subCategoryOptions: string[];
  yearOptions: string[];
  /** Erreurs Zod sur les champs prix (saisie invalide ou min supérieur au max). */
  priceFilterErrors: Partial<Record<CatalogPriceFilterFieldKey, string>>;
};

export function useProductFilters(
  products: CatalogProduct[],
  productPayload: CatalogProductPayloadMetadata | null,
  shopBrands?: string[],
): UseProductFiltersResult {
  const [filters, setFilters] = useState<ProductFilter>(DEFAULT_FILTERS);

  const setFilter = useCallback(<K extends keyof ProductFilter>(key: K, value: ProductFilter[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const brandOptions = useMemo(() => {
    if (shopBrands !== undefined) {
      return uniqueSorted(shopBrands);
    }
    const fromApi = productPayload?.brands ?? [];
    if (fromApi.length) return uniqueSorted(fromApi);
    return uniqueSorted(products.map((p) => p.brand).filter(Boolean) as string[]);
  }, [shopBrands, productPayload?.brands, products]);

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
    return uniqueSorted(products.map((p) => String(p.year)).filter(Boolean));
  }, [productPayload?.years, products]);

  const { priceBounds, priceFilterErrors } = useMemo(() => {
    const parsed = catalogPriceFilterSchema.safeParse({
      priceMin: filters.priceMin,
      priceMax: filters.priceMax,
    });
    if (parsed.success) {
      return { priceBounds: parsed.data, priceFilterErrors: {} as Partial<Record<CatalogPriceFilterFieldKey, string>> };
    }
    return {
      priceBounds: null,
      priceFilterErrors: parseZodFieldErrors<CatalogPriceFilterFieldKey>(parsed.error),
    };
  }, [filters.priceMin, filters.priceMax]);

  const filteredProducts = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    return products.filter((p) => {
      if (filters.brand && p.brand.toLowerCase() !== filters.brand.toLowerCase()) return false;
      if (filters.category && p.category !== filters.category) return false;
      if (filters.subCategory && p.subCategory !== filters.subCategory) return false;
      if (filters.year && String(p.year) !== filters.year) return false;
      if (priceBounds) {
        if (priceBounds.min !== undefined && p.price < priceBounds.min) return false;
        if (priceBounds.max !== undefined && p.price > priceBounds.max) return false;
      }
      if (q) {
        const haystack = [p.brand, p.category, p.subCategory, p.name, p.description]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [products, filters, priceBounds]);

  const hasActiveFilters = useMemo(
    () =>
      Boolean(
        filters.search.trim() ||
          filters.brand ||
          filters.category ||
          filters.subCategory ||
          filters.year ||
          filters.priceMin.trim() ||
          filters.priceMax.trim(),
      ),
    [filters],
  );

  return {
    filters,
    setFilter,
    hasActiveFilters,
    filteredProducts,
    brandOptions,
    categoryOptions,
    subCategoryOptions,
    yearOptions,
    priceFilterErrors,
  };
}
