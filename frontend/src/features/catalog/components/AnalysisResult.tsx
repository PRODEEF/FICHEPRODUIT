import { useCallback, useMemo, useState } from 'react';

import type { ProductListResponse, SiteAnalysis } from '@lib/analysis/analysisApi';

import { useProductFilters } from '../hooks/useProductFilters';
import { useProductSelection } from '../hooks/useProductSelection';
import { AnalysisSiteSummary } from './AnalysisSiteSummary';
import { BrandChips } from './BrandChips';
import { ProductFilters } from './ProductFilters';
import { ProductResultsToolbar } from './ProductResultsToolbar';
import { ProductTable } from './ProductTable';

const STATUS_LABELS: Record<SiteAnalysis['status'], string> = {
  pending: 'En attente',
  in_progress: 'En cours',
  completed: 'Terminée',
  failed: 'Échec',
};

export type AnalysisResultProps = {
  loading: boolean;
  error: string | null;
  analysis: SiteAnalysis | null;
  productPayload: ProductListResponse | null;
};

export function AnalysisResult(props: AnalysisResultProps) {
  return <AnalysisResultContent key={props.analysis?.id ?? 'none'} {...props} />;
}

function AnalysisResultContent({ loading, error, analysis, productPayload }: AnalysisResultProps) {
  const [removedIds, setRemovedIds] = useState<Set<string>>(() => new Set());

  const allProducts = useMemo(
    () => (productPayload?.products ?? []).filter((p) => !removedIds.has(p.id)),
    [productPayload?.products, removedIds],
  );

  const { filters, setFilter, filteredProducts, brandOptions, categoryOptions, subCategoryOptions, yearOptions } =
    useProductFilters(allProducts, productPayload);

  const handleRemoveIds = useCallback((ids: string[]) => {
    setRemovedIds((prev) => new Set([...prev, ...ids]));
  }, []);

  const { selectedIds, toggleOne, toggleSelectAll, allFilteredSelected, someFilteredSelected, selectedInViewCount, importSelected, deleteSelected } =
    useProductSelection(filteredProducts, filters, handleRemoveIds);

  const brandsForChips = useMemo(() => {
    const fromAnalysis = analysis?.brandsList?.length ? analysis.brandsList : null;
    return fromAnalysis ?? brandOptions;
  }, [analysis, brandOptions]);

  const productCountDisplay =
    analysis?.productCount != null && analysis.productCount > 0
      ? analysis.productCount
      : allProducts.length;

  const brandCountDisplay = analysis?.brandsList?.length
    ? analysis.brandsList.length
    : brandOptions.length;

  if (loading) {
    return (
      <p className="text-sm text-text-secondary" aria-busy="true">
        Chargement…
      </p>
    );
  }

  if (error) {
    return (
      <div className="mb-4 rounded-xl border border-border-purple bg-purple-50 px-4 py-3 text-text-primary" role="alert">
        {error}
      </div>
    );
  }

  if (!analysis) return null;

  if (analysis.status === 'failed') {
    return (
      <div className="mb-4 rounded-xl border border-red-500/35 bg-red-50 px-4 py-3 text-text-primary" role="alert">
        {analysis.errorMessage ?? 'Analyse terminée avec erreur.'}
      </div>
    );
  }

  if (analysis.status !== 'completed') {
    return (
      <p className="text-sm text-text-secondary">Statut&nbsp;: {STATUS_LABELS[analysis.status]}</p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <AnalysisSiteSummary
        analysis={analysis}
        productCount={productCountDisplay}
        brandCount={brandCountDisplay}
      />

      <section aria-labelledby="analyses-products-heading">
        <h2 id="analyses-products-heading" className="mb-4 mt-8 text-lg font-bold text-text-primary">
          Produits proposés
        </h2>

        <div className="flex flex-col gap-4">
          <BrandChips
            brands={brandsForChips}
            activeBrand={filters.brand}
            onToggle={(brand) => setFilter('brand', filters.brand === brand ? '' : brand)}
          />

          <ProductFilters
            filters={filters}
            onFilterChange={setFilter}
            brandOptions={brandOptions}
            categoryOptions={categoryOptions}
            subCategoryOptions={subCategoryOptions}
            yearOptions={yearOptions}
          />

          <ProductResultsToolbar
            totalCount={filteredProducts.length}
            selectedCount={selectedInViewCount}
            onImport={importSelected}
            onDelete={deleteSelected}
          />

          {filteredProducts.length === 0 ? (
            <p className="my-4 text-text-secondary">
              {allProducts.length === 0
                ? 'Aucun produit pour cette analyse.'
                : 'Aucun produit ne correspond aux filtres.'}
            </p>
          ) : (
            <ProductTable
              products={filteredProducts}
              selectedIds={selectedIds}
              allSelected={allFilteredSelected}
              someSelected={someFilteredSelected}
              onToggleOne={toggleOne}
              onToggleAll={toggleSelectAll}
            />
          )}
        </div>
      </section>
    </div>
  );
}
