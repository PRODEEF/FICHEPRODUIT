import type { CatalogProduct } from '@types-api';

import type { CatalogProductPayloadMetadata } from '../types';
import { useCatalogProductsSection } from '../hooks/useCatalogProductsSection';
import { ExportConfirmationModal } from './ExportConfirmationModal';
import { ProductFilters } from './ProductFilters';
import { ProductResultsToolbar } from './ProductResultsToolbar';
import { ProductTable } from './ProductTable';

export interface CatalogProductsSectionProps {
  shopName?: string | undefined;
  shopId?: string | null | undefined;
  isConnected: boolean;
  products: CatalogProduct[];
  productPayload: CatalogProductPayloadMetadata | null;
  isLoadingProducts: boolean;
  shopBrands?: string[] | undefined;
  defaultShopSector?: string | null | undefined;
  externalBrandFilter?: string | undefined;
  onBrandFilterChange?: ((brand: string) => void) | undefined;
}

export function CatalogProductsSection({
  shopName = '',
  shopId,
  isConnected,
  products,
  productPayload,
  isLoadingProducts,
  shopBrands,
  defaultShopSector,
  externalBrandFilter,
  onBrandFilterChange,
}: CatalogProductsSectionProps) {
  const hasShopBrands = Boolean(shopBrands?.some((brand) => brand.trim()));

  const section = useCatalogProductsSection({
    products,
    productPayload,
    shopId,
    shopBrands,
    defaultShopSector,
    externalBrandFilter,
    onBrandFilterChange,
  });

  return (
    <section aria-labelledby="catalog-products-heading">
      <h2 id="catalog-products-heading" className="mb-2 mt-5 text-lg font-bold text-text-primary">
        Catalogue de fiches produits
      </h2>

      <p className="mb-4 text-sm text-text-secondary">
        {hasShopBrands
          ? 'Voici les fiches produits disponibles correspondant aux marques de votre boutique.'
          : 'Voici des exemples issus du catalogue global (toutes marques disponibles).'}
      </p>

      <div className="flex flex-col gap-4">
        <ProductFilters
          filters={section.effectiveFilters}
          onFilterChange={(key, value) => {
            if (key === 'brand') {
              section.handleBrandChange(value);
            } else {
              section.setFilter(key, value);
            }
          }}
          onReset={section.handleResetFilters}
          canReset={section.canResetFilters}
          brandOptions={section.brandOptions}
          categoryOptions={section.categoryOptions}
          subCategoryOptions={section.subCategoryOptions}
          yearOptions={section.yearOptions}
        />

        {section.displayProducts.length > 0 ? (
          <ProductResultsToolbar
            isConnected={isConnected}
            totalCount={section.displayProducts.length}
            selectedCount={section.selectedInViewCount}
            onDelete={section.deleteSelected}
            onExport={() => {
              if (section.selectedInViewCount === 0 || section.isExporting) return;
              section.openExportConfirmation();
            }}
          />
        ) : null}

        {isLoadingProducts ? (
          <p className="my-4 text-text-secondary" aria-busy="true">
            Chargement des produits du catalogue…
          </p>
        ) : section.allProducts.length === 0 ? (
          <p className="my-4 text-text-secondary">
            Aucun exemple disponible pour le moment. Configurez vos marques ou réessayez plus tard.
          </p>
        ) : section.hasEffectiveFilters && section.displayProducts.length === 0 ? (
          <p className="my-4 text-text-secondary">
            Aucune fiche ne correspond à cette marque ou à ces filtres.
          </p>
        ) : (
          <ProductTable
            shopName={shopName}
            products={section.displayProducts}
            selectedIds={section.selectedIds}
            allSelected={section.allFilteredSelected}
            someSelected={section.someFilteredSelected}
            onToggleOne={section.toggleOne}
            onToggleAll={section.toggleSelectAll}
          />
        )}
      </div>
      <ExportConfirmationModal
        open={section.exportConfirmOpen}
        onClose={section.closeExportConfirmation}
        selectedCount={section.selectedInViewCount}
        onConfirm={() => {
          void section.confirmExport();
        }}
        isExporting={section.isExporting}
      />
    </section>
  );
}
