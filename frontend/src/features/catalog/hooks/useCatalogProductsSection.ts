import { useCallback, useEffect, useMemo, useState } from 'react';

import type { CatalogProduct } from '@types-api';

import { useBilling } from '../../billing/hooks/useBilling';
import { useCatalogProductExport } from './useCatalogProductExport';
import type { CatalogProductPayloadMetadata, ProductFilter } from '../types';
import {
  countFreeExportProducts,
  estimateExportCredits,
  getFreeLowPriceExportsExpiresAt,
  hasActiveFreeLowPriceExports,
} from '../lib/estimateExportCredits';
import { findOptionCaseInsensitive } from '../lib/catalogFilterOptions';
import { useProductFilters } from './useProductFilters';
import { useProductSelection } from './useProductSelection';

interface UseCatalogProductsSectionOptions {
  products: CatalogProduct[];
  productPayload: CatalogProductPayloadMetadata | null;
  shopBrands?: string[] | undefined;
  defaultShopSector?: string | null | undefined;
  externalBrandFilter?: string | undefined;
  onBrandFilterChange?: ((brand: string) => void) | undefined;
}

export function useCatalogProductsSection({
  products,
  productPayload,
  shopBrands,
  defaultShopSector,
  externalBrandFilter,
  onBrandFilterChange,
}: UseCatalogProductsSectionOptions) {
  const { summary: billingSummary, loading: billingLoading } = useBilling();
  const {
    exportConfirmOpen,
    openExportConfirmation,
    closeExportConfirmation,
    confirmExport,
  } = useCatalogProductExport();
  const [removedIds, setRemovedIds] = useState<Set<string>>(() => new Set());

  const allProducts = products.filter((p) => !removedIds.has(p.id));

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
  } = useProductFilters(allProducts, productPayload, shopBrands, defaultShopSector);

  const canonicalExternalBrand = useMemo(() => {
    if (externalBrandFilter === undefined) return undefined;
    if (!externalBrandFilter.trim()) return '';
    return findOptionCaseInsensitive(brandOptions, externalBrandFilter) ?? externalBrandFilter;
  }, [externalBrandFilter, brandOptions]);

  useEffect(() => {
    if (canonicalExternalBrand === undefined) return;
    setFilter('brand', canonicalExternalBrand);
  }, [canonicalExternalBrand, setFilter]);

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

  const canResetFilters =
    hasActiveFilters || Boolean(externalBrandFilter?.trim());

  const hasEffectiveFilters =
    hasActiveFilters || Boolean(externalBrandFilter?.trim());

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

  const selectedProducts = useMemo(
    () => displayProducts.filter((product) => selectedIds.has(product.id)),
    [displayProducts, selectedIds],
  );

  const exportCreditsEstimate = useMemo(() => {
    const estimate = estimateExportCredits(
      selectedProducts,
      selectedInViewCount,
      billingSummary,
    );

    if (billingSummary?.hasUnlimitedExports) {
      return estimate;
    }

    if (!billingSummary && selectedInViewCount > 0) {
      return {
        requiredCredits: selectedInViewCount,
        availableCredits: 0,
        hasEnoughCredits: false,
      };
    }

    if (billingLoading && billingSummary) {
      return {
        ...estimate,
        hasEnoughCredits: estimate.requiredCredits <= billingSummary.balance,
      };
    }

    return estimate;
  }, [selectedProducts, selectedInViewCount, billingSummary, billingLoading]);

  const hasFreeLowPriceExports = hasActiveFreeLowPriceExports(billingSummary);
  const freeExportCount = countFreeExportProducts(selectedProducts, hasFreeLowPriceExports);
  const freeLowPriceExportsExpiresAt = getFreeLowPriceExportsExpiresAt(billingSummary);

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
    openExportConfirmation,
    closeExportConfirmation,
    confirmExport,
    exportCreditsEstimate,
    billingSummary,
    hasFreeLowPriceExports,
    freeExportCount,
    freeLowPriceExportsExpiresAt,
  };
}
