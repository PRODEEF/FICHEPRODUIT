import { useMemo, useState } from 'react';

import type { Analysis, CatalogProduct, Shop } from '@types-api';
import type { CatalogProductPayloadMetadata } from '../types';

import { resolveCatalogWorkflowStatus } from '../lib/catalogWorkflowStatus';
import { AnalysisSummarySection } from './AnalysisSummarySection';
import { CatalogProductsSection } from './CatalogProductsSection';

export interface AnalysisResultProps {
  isConnected: boolean;
  loading: boolean;
  error: string | null;
  analysis: Analysis | null;
  shop: Shop | null;
  products: CatalogProduct[] | null;
  productPayload: CatalogProductPayloadMetadata | null;
}

export function AnalysisResult(props: AnalysisResultProps) {
  return <AnalysisResultContent key={props.analysis?.id ?? 'none'} {...props} />;
}

function AnalysisResultContent({
  isConnected,
  loading,
  error,
  analysis,
  shop,
  products,
  productPayload,
}: AnalysisResultProps) {
  const workflowStatus = resolveCatalogWorkflowStatus({
    analysis,
    loadingProducts: loading,
    hasProducts: Boolean(products?.length),
    error,
  });

  const [activeBrand, setActiveBrand] = useState('');

  const allProducts = useMemo(() => products ?? [], [products]);

  const handleBrandToggle = (brand: string) => {
    setActiveBrand((prev) => (prev === brand ? '' : brand));
  };

  const isDone = analysis?.status === 'done';
  const isLoadingProducts = workflowStatus === 'loading_products';

  return (
    <div className="flex flex-col gap-4">
      <AnalysisSummarySection
        loading={loading}
        error={error}
        analysis={analysis}
        shop={shop}
        allProducts={allProducts}
        activeBrand={activeBrand}
        onBrandToggle={handleBrandToggle}
      />

      {isDone && workflowStatus !== 'waiting_analysis' ? (
        <CatalogProductsSection
          shopName={shop?.name ?? ''}
          isConnected={isConnected}
          products={allProducts}
          productPayload={productPayload}
          isLoadingProducts={isLoadingProducts}
          shopBrands={shop?.brands}
          externalBrandFilter={activeBrand}
          onBrandFilterChange={setActiveBrand}
        />
      ) : null}
    </div>
  );
}
