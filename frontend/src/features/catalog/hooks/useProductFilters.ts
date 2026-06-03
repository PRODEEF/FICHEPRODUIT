import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { CatalogProduct } from '@types-api';

import type { CatalogProductPayloadMetadata, ProductFilter } from '../types';
import {
  createCatalogDefaultFilters,
  resolveDefaultShopSector,
} from '../lib/catalogFilterDefaults';
import {
  buildBrandOptions,
  buildCategoryOptions,
  buildSubCategoryOptions,
  buildYearOptions,
} from '../lib/catalogFilterOptions';

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

function matchesSector(product: CatalogProduct, sector: string): boolean {
  return product.sector.trim().toLowerCase() === sector.trim().toLowerCase();
}

function pruneDependentFilters(
  prev: Pick<ProductFilter, 'category' | 'subCategory' | 'brand' | 'year'>,
  options: {
    categoryOptions: string[];
    subCategoryOptions: string[];
    brandOptions: string[];
    yearOptions: string[];
  },
): Pick<ProductFilter, 'category' | 'subCategory' | 'brand' | 'year'> {
  let { category, subCategory, brand, year } = prev;
  const { categoryOptions, subCategoryOptions, brandOptions, yearOptions } = options;

  if (category && !categoryOptions.includes(category)) {
    category = '';
    subCategory = '';
    brand = '';
    year = '';
  } else if (subCategory && !subCategoryOptions.includes(subCategory)) {
    subCategory = '';
    brand = '';
    year = '';
  } else if (brand && !brandOptions.includes(brand)) {
    brand = '';
    year = '';
  } else if (year && !yearOptions.includes(year)) {
    year = '';
  }

  return { category, subCategory, brand, year };
}

export function useProductFilters(
  products: CatalogProduct[],
  _productPayload: CatalogProductPayloadMetadata | null,
  shopBrands?: string[],
  defaultShopSector?: string | null,
): UseProductFiltersResult {
  const defaultSector = useMemo(
    () => resolveDefaultShopSector(defaultShopSector),
    [defaultShopSector],
  );

  const [filters, setFilters] = useState<ProductFilter>(() =>
    createCatalogDefaultFilters(defaultSector),
  );

  const previousDefaultSectorRef = useRef(defaultSector);

  useEffect(() => {
    const previousDefault = previousDefaultSectorRef.current;
    if (defaultSector === previousDefault) {
      return;
    }
    previousDefaultSectorRef.current = defaultSector;

    setFilters((prev) => {
      if (prev.sector !== previousDefault) {
        return prev;
      }
      return createCatalogDefaultFilters(defaultSector);
    });
  }, [defaultSector]);

  const setFilter = useCallback(
    <K extends keyof ProductFilter>(key: K, value: ProductFilter[K]) => {
      setFilters((prev) => {
        const next = { ...prev, [key]: value };

        if (key === 'sector' && value !== prev.sector) {
          next.category = '';
          next.subCategory = '';
          next.brand = '';
          next.year = '';
        } else if (key === 'category' && value !== prev.category) {
          next.subCategory = '';
          next.brand = '';
          next.year = '';
        } else if (key === 'subCategory' && value !== prev.subCategory) {
          next.brand = '';
          next.year = '';
        } else if (key === 'brand' && value !== prev.brand) {
          next.year = '';
        }

        return next;
      });
    },
    [],
  );

  const resetFilters = useCallback(() => {
    setFilters(createCatalogDefaultFilters(defaultSector));
  }, [defaultSector]);

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

  const prunedDependentFilters = useMemo(
    () =>
      pruneDependentFilters(
        {
          category: filters.category,
          subCategory: filters.subCategory,
          brand: filters.brand,
          year: filters.year,
        },
        {
          categoryOptions,
          subCategoryOptions,
          brandOptions,
          yearOptions,
        },
      ),
    [filters, categoryOptions, subCategoryOptions, brandOptions, yearOptions],
  );

  if (
    prunedDependentFilters.category !== filters.category ||
    prunedDependentFilters.subCategory !== filters.subCategory ||
    prunedDependentFilters.brand !== filters.brand ||
    prunedDependentFilters.year !== filters.year
  ) {
    setFilters((prev) => ({ ...prev, ...prunedDependentFilters }));
  }

  const filteredProducts = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    return products.filter((p) => {
      if (filters.sector && !matchesSector(p, filters.sector)) return false;
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
  }, [products, filters]);

  const hasActiveFilters = useMemo(() => {
    const sectorDiffersFromDefault = filters.sector !== defaultSector;
    return Boolean(
      filters.search.trim() ||
      sectorDiffersFromDefault ||
      filters.category ||
      filters.subCategory ||
      filters.brand ||
      filters.year,
    );
  }, [filters, defaultSector]);

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
