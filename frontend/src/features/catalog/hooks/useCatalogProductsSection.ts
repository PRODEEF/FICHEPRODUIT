import { useCallback, useEffect, useMemo, useState } from 'react';

import type { CatalogProduct } from '@types-api';

import { useCatalogProductExport } from './useCatalogProductExport';
import type { CatalogProductPayloadMetadata, ProductFilter } from '../types';
import { findOptionCaseInsensitive } from '../lib/catalogFilterOptions';
import { useProductFilters } from './useProductFilters';
import { useProductSelection } from './useProductSelection';

interface UseCatalogProductsSectionOptions {
  products: CatalogProduct[];
  productPayload: CatalogProductPayloadMetadata | null;
  shopId?: string | null | undefined;
  shopBrands?: string[] | undefined;
  externalBrandFilter?: string | undefined;
  onBrandFilterChange?: ((brand: string) => void) | undefined;
}

export function useCatalogProductsSection({
  products,
  productPayload,
  shopId,
  shopBrands,
  externalBrandFilter,
  onBrandFilterChange,
}: UseCatalogProductsSectionOptions) {
  const [removedIds, setRemovedIds] = useState<Set<string>>(() => new Set());

  const allProducts = useMemo(
    () => products.filter((p) => !removedIds.has(p.id)),
    [products, removedIds],
  );

  const {
    filters,
    setFilter,
    resetFilters,
    hasActiveFilters,
    filteredProducts,
    brandOptions,
    categoryOptions,
    subCategoryOptions,
    yearOptions,
  } = useProductFilters(allProducts, productPayload, shopBrands);

  const canonicalExternalBrand = useMemo(() => {
    if (externalBrandFilter === undefined) return undefined;
    if (!externalBrandFilter.trim()) return '';
    return findOptionCaseInsensitive(brandOptions, externalBrandFilter) ?? externalBrandFilter;
  }, [externalBrandFilter, brandOptions]);

  useEffect(() => {
    if (canonicalExternalBrand === undefined) return;
    if (filters.brand !== canonicalExternalBrand) {
      setFilter('brand', canonicalExternalBrand);
    }
  }, [canonicalExternalBrand, filters.brand, setFilter]);

  const handleBrandChange = useCallback(
    (brand: string) => {
      setFilter('brand', brand);
      onBrandFilterChange?.(brand);
    },
    [setFilter, onBrandFilterChange],
  );

  const handleResetFilters = useCallback(() => {
    resetFilters();
    onBrandFilterChange?.('');
  }, [resetFilters, onBrandFilterChange]);

  const canResetFilters = hasActiveFilters || Boolean(externalBrandFilter?.trim());

  const hasEffectiveFilters = hasActiveFilters || Boolean(externalBrandFilter?.trim());

  const effectiveFilters: ProductFilter =
    canonicalExternalBrand !== undefined && canonicalExternalBrand !== filters.brand
      ? { ...filters, brand: canonicalExternalBrand }
      : filters;

  const displayProducts = filteredProducts;

  const handleRemoveIds = useCallback((ids: string[]) => {
    setRemovedIds((prev) => new Set([...prev, ...ids]));
  }, []);

  const {
    selectedIds,
    toggleOne,
    toggleSelectAll,
    allFilteredSelected,
    someFilteredSelected,
    selectedInViewCount,
    deleteSelected,
  } = useProductSelection(displayProducts, effectiveFilters, handleRemoveIds);

  const selectedProductIds = useMemo(() => Array.from(selectedIds), [selectedIds]);

  const {
    exportConfirmOpen,
    isExporting,
    previewLoading,
    previewError,
    pairs,
    treeOptions,
    selections,
    manufacturerValue,
    openExportConfirmation,
    closeExportConfirmation,
    setPairSelection,
    confirmExport,
  } = useCatalogProductExport({ shopId, selectedProductIds });

  return {
    allProducts,
    displayProducts,
    effectiveFilters,
    brandOptions,
    categoryOptions,
    subCategoryOptions,
    yearOptions,
    handleBrandChange,
    handleResetFilters,
    canResetFilters,
    hasEffectiveFilters,
    setFilter,
    selectedIds,
    toggleOne,
    toggleSelectAll,
    allFilteredSelected,
    someFilteredSelected,
    selectedInViewCount,
    deleteSelected,
    exportConfirmOpen,
    isExporting,
    previewLoading,
    previewError,
    pairs,
    treeOptions,
    selections,
    manufacturerValue,
    openExportConfirmation,
    closeExportConfirmation,
    setPairSelection,
    confirmExport,
  };
}
