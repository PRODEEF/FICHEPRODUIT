import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import type { CatalogProduct } from '@types-api';
import type { CatalogProductPayloadMetadata, ProductFilter } from '../types';

import { useProductFilters } from '../hooks/useProductFilters';
import { useProductSelection } from '../hooks/useProductSelection';
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
  externalBrandFilter,
  onBrandFilterChange,
  introVariant = 'shop',
}: CatalogProductsSectionProps) {
  const [removedIds, setRemovedIds] = useState<Set<string>>(() => new Set());

  const allProducts = products.filter((p) => !removedIds.has(p.id));

  const {
    filters,
    setFilter,
    hasActiveFilters,
    filteredProducts,
    brandOptions,
    categoryOptions,
    subCategoryOptions,
    yearOptions,
    priceFilterErrors,
  } = useProductFilters(allProducts, productPayload, shopBrands);

  // Keep hook filters in sync when brand is driven only from parent (e.g. ShopSummarySection chips)
  useEffect(() => {
    if (externalBrandFilter === undefined) return;
    setFilter('brand', externalBrandFilter);
  }, [externalBrandFilter, setFilter]);

  // Synchronisation bidirectionnelle avec le filtre brand externe (BrandChips)
  const handleBrandChange = useCallback(
    (brand: string) => {
      setFilter('brand', brand);
      onBrandFilterChange?.(brand);
    },
    [setFilter, onBrandFilterChange],
  );

  // Si le parent impose un filtre brand (via BrandChips), on le propage
  const effectiveFilters: ProductFilter =
    externalBrandFilter !== undefined && externalBrandFilter !== filters.brand
      ? { ...filters, brand: externalBrandFilter }
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

  return (
    <section aria-labelledby="catalog-products-heading">
      <h2 id="catalog-products-heading" className="mb-2 mt-5 text-lg font-bold text-text-primary">
        Catalogue de fiches produits
      </h2>

      <p className="mb-4 text-sm text-text-secondary">
        {introVariant === 'all'
          ? 'Voici des exemples issus du catalogue public (toutes marques disponibles).'
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
          brandOptions={brandOptions}
          categoryOptions={categoryOptions}
          subCategoryOptions={subCategoryOptions}
          yearOptions={yearOptions}
          priceFilterErrors={priceFilterErrors}
        />

        {displayProducts.length > 0 ? (
          <ProductResultsToolbar
            isConnected={isConnected}
            totalCount={displayProducts.length}
            selectedCount={selectedInViewCount}
            onDelete={deleteSelected}
            onExport={() => {
              toast.info('Export non disponible pour le moment', {
                description:
                  'L’export des fiches sélectionnées sera proposé ici dès que l’API d’export sera branchée.',
              });
            }}
          />
        ) : null}

        {isLoadingProducts ? (
          <p className="my-4 text-text-secondary" aria-busy="true">
            Chargement des produits du catalogue…
          </p>
        ) : allProducts.length === 0 ? (
          <p className="my-4 text-text-secondary">Aucun exemple disponible pour cette analyse.</p>
        ) : hasActiveFilters && filteredProducts.length === 0 ? (
          <p className="my-4 text-text-secondary">Aucun exemple ne correspond aux filtres.</p>
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
    </section>
  );
}
