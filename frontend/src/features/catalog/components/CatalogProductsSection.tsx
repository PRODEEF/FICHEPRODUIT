import { useCallback, useEffect, useMemo, useState } from 'react';

import type { CatalogProduct } from '@types-api';

import { useBilling } from '../../billing/hooks/useBilling';
import { useCatalogProductExport } from '../hooks/useCatalogProductExport';
import type { CatalogProductPayloadMetadata, ProductFilter } from '../types';

import {
  countFreeExportProducts,
  estimateExportCredits,
  getFreeLowPriceExportsExpiresAt,
  hasActiveFreeLowPriceExports,
} from '../lib/estimateExportCredits';
import { findOptionCaseInsensitive } from '../lib/catalogFilterOptions';
import { useProductFilters } from '../hooks/useProductFilters';
import { useProductSelection } from '../hooks/useProductSelection';
import { ExportConfirmationModal } from './ExportConfirmationModal';
import { ProductFilters } from './ProductFilters';
import { ProductResultsToolbar } from './ProductResultsToolbar';
import { ProductTable } from './ProductTable';

export interface CatalogProductsSectionProps {
  /** Nom affiché dans la prévisualisation produit (ex. nom de la boutique). */
  shopName?: string | undefined;
  isConnected: boolean;
  products: CatalogProduct[];
  productPayload: CatalogProductPayloadMetadata | null;
  isLoadingProducts: boolean;
  shopBrands?: string[] | undefined;
  /** Secteur boutique : valeur par défaut du filtre secteur et cible du reset. */
  defaultShopSector?: string | null | undefined;
  externalBrandFilter?: string | undefined;
  onBrandFilterChange?: ((brand: string) => void) | undefined;
  /** Texte d’intro : périmètre lié au magasin ou parcours de tout le catalogue public. */
  introVariant?: 'shop' | 'all' | undefined;
}

export function CatalogProductsSection({
  shopName = '',
  isConnected,
  products,
  productPayload,
  isLoadingProducts,
  shopBrands,
  defaultShopSector,
  externalBrandFilter,
  onBrandFilterChange,
  introVariant = 'shop',
}: CatalogProductsSectionProps) {
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

  // Sync filtre interne quand la marque est pilotée par le parent (ex. BrandChips)
  useEffect(() => {
    if (canonicalExternalBrand === undefined) return;
    setFilter('brand', canonicalExternalBrand);
  }, [canonicalExternalBrand, setFilter]);

  // Synchronisation bidirectionnelle avec le filtre brand externe (BrandChips)
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

    // Solde inconnu : bloquer dès qu'une sélection existe.
    if (!billingSummary && selectedInViewCount > 0) {
      return {
        requiredCredits: selectedInViewCount,
        availableCredits: 0,
        hasEnoughCredits: false,
      };
    }

    // Rafraîchissement en cours : conserver le dernier solde connu.
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

  return (
    <section aria-labelledby="catalog-products-heading">
      <h2 id="catalog-products-heading" className="mb-2 mt-5 text-lg font-bold text-text-primary">
        Catalogue de fiches produits
      </h2>

      <p className="mb-4 text-sm text-text-secondary">
        {introVariant === 'all'
          ? 'Voici des exemples issus du catalogue global (toutes marques disponibles).'
          : 'Voici les fiches produits disponibles par rapport aux marques analysées de votre boutique.'}
      </p>

      <div className="flex flex-col gap-4">
        <ProductFilters
          filters={effectiveFilters}
          onFilterChange={(key, value) => {
            if (key === 'brand') {
              handleBrandChange(value);
            } else {
              setFilter(key, value);
            }
          }}
          onReset={handleResetFilters}
          canReset={canResetFilters}
          brandOptions={brandOptions}
          categoryOptions={categoryOptions}
          subCategoryOptions={subCategoryOptions}
          yearOptions={yearOptions}
        />

        {displayProducts.length > 0 ? (
          <ProductResultsToolbar
            isConnected={isConnected}
            totalCount={displayProducts.length}
            selectedCount={selectedInViewCount}
            onDelete={deleteSelected}
            onExport={() => {
              if (selectedInViewCount === 0) return;
              openExportConfirmation();
            }}
          />
        ) : null}

        {isLoadingProducts ? (
          <p className="my-4 text-text-secondary" aria-busy="true">
            Chargement des produits du catalogue…
          </p>
        ) : allProducts.length === 0 ? (
          <p className="my-4 text-text-secondary">
            Aucun exemple disponible pour le moment. Configurez vos marques ou réessayez plus tard.
          </p>
        ) : hasEffectiveFilters && filteredProducts.length === 0 ? (
          <p className="my-4 text-text-secondary">
            Aucune fiche ne correspond à cette marque ou à ces filtres.
          </p>
        ) : (
          <ProductTable
            shopName={shopName}
            products={displayProducts}
            selectedIds={selectedIds}
            allSelected={allFilteredSelected}
            someSelected={someFilteredSelected}
            onToggleOne={toggleOne}
            onToggleAll={toggleSelectAll}
          />
        )}
      </div>
      <ExportConfirmationModal
        open={exportConfirmOpen}
        onClose={closeExportConfirmation}
        selectedCount={selectedInViewCount}
        requiredCredits={exportCreditsEstimate.requiredCredits}
        availableCredits={exportCreditsEstimate.availableCredits}
        hasEnoughCredits={exportCreditsEstimate.hasEnoughCredits}
        hasUnlimitedExports={billingSummary?.hasUnlimitedExports ?? false}
        hasFreeLowPriceExports={hasFreeLowPriceExports}
        freeExportCount={freeExportCount}
        freeLowPriceExportsExpiresAt={freeLowPriceExportsExpiresAt}
        onConfirm={confirmExport}
      />
    </section>
  );
}
