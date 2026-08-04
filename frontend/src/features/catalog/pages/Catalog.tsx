import { useCallback, useMemo } from 'react';

import { AnalysisProgress } from '@shared/components/AnalysisProgress';
import { useAuth } from '@shared/hooks/useAuth';
import { useSiteAnalysis } from '@shared/hooks/useSiteAnalysis';

import { useSignupAutoAnalyze } from '../../auth/hooks/useSignupAutoAnalyze';
import { useShop } from '../../store/hooks/useShop';
import { CatalogPageLayout } from '../components/CatalogPageLayout';
import { CatalogProductsSection } from '../components/CatalogProductsSection';
import { useActiveBrandForAnalysis } from '../hooks/useActiveBrandForAnalysis';
import { useCatalogAnalysis } from '../hooks/useCatalogAnalysis';
import { useCatalogProducts } from '../hooks/useCatalogProducts';
import { useBrandToggle } from '../lib/useBrandToggle';
import { resolveCatalogWorkflowStatus } from '../lib/catalogWorkflowStatus';

/**
 * Catalogue privé de l'utilisateur connecté sur `/catalog`.
 *
 * Les exemples produits et le magasin sont accessibles même sans analyse récente ; l'analyse
 * du compte s'affiche en complément lorsqu'elle existe.
 */
export function Catalog() {
  const { userEmail } = useAuth();
  const { shop, loading: shopLoading, error: shopError } = useShop();

  const { runAnalysis, analysisOpen, siteAnalysis, dismissError } = useSiteAnalysis();
  const dismissAutoAnalyze = useCallback(() => {
    dismissError();
  }, [dismissError]);

  useSignupAutoAnalyze({ runAnalysis });

  const { analysisId, analysis, detailError } = useCatalogAnalysis({
    skipProductFetch: true,
  });

  const {
    products: catalogProducts,
    productPayload,
    loading: productsLoading,
    error: productsError,
  } = useCatalogProducts({
    shop,
    shopLoading,
  });

  const { activeBrand, setActiveBrand } = useActiveBrandForAnalysis(analysisId);
  const handleBrandToggle = useBrandToggle(setActiveBrand);

  const allProducts = useMemo(() => catalogProducts ?? [], [catalogProducts]);

  const workflowStatus = resolveCatalogWorkflowStatus({
    analysis,
    loadingProducts: productsLoading,
    hasProducts: Boolean(catalogProducts?.length),
    error: detailError ?? productsError,
  });

  const isLoadingProducts = workflowStatus === 'loading_products';

  return (
    <CatalogPageLayout
      topBanner={
        analysisOpen && siteAnalysis ? (
          <AnalysisProgress analysis={siteAnalysis} onDismiss={dismissAutoAnalyze} />
        ) : null
      }
      shopLoading={shopLoading}
      shopError={shopError}
      shop={shop}
      activeBrand={activeBrand}
      onBrandToggle={handleBrandToggle}
      productsLoading={productsLoading}
      productsError={productsError}
      productsSection={
        catalogProducts !== null ? (
          <CatalogProductsSection
            shopName={shop?.name ?? ''}
            shopId={shop?.id}
            isConnected={Boolean(userEmail)}
            products={allProducts}
            productPayload={productPayload}
            isLoadingProducts={isLoadingProducts}
            shopBrands={shop?.brands}
            externalBrandFilter={activeBrand}
            onBrandFilterChange={setActiveBrand}
          />
        ) : null
      }
    />
  );
}
