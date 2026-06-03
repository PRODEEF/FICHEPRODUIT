import { useCallback, useMemo, useState } from 'react';

import { AnalysisProgress } from '@shared/components/AnalysisProgress';
import { useAuth } from '@shared/hooks/useAuth';
import { useSiteAnalysis } from '@shared/hooks/useSiteAnalysis';

import { useSignupAutoAnalyze } from '../../auth/hooks/useSignupAutoAnalyze';
import { CatalogProductsSection } from '../components/CatalogProductsSection';
import { EmptyProducts } from '../components/EmptyProducts';
import { ErrorState, LoadingState } from '../components/CatalogSectionStates';
import { ShopSummarySection } from '../components/ShopSummarySection';
import { useCatalogAnalysis } from '../hooks/useCatalogAnalysis';
import { useCatalogProducts } from '../hooks/useCatalogProducts';
import { resolveCatalogWorkflowStatus } from '../lib/catalogWorkflowStatus';
import { useShop } from '../../store/hooks/useShop';

/**
 * Catalogue privé de l'utilisateur connecté sur `/catalog`.
 *
 * Les exemples produits et le magasin sont accessibles même sans analyse récente ; l'analyse
 * du compte s'affiche en complément lorsqu'elle existe.
 */
export function Catalog() {
  const { profile } = useAuth();
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

  const [activeBrand, setActiveBrand] = useState('');
  const [activeBrandForAnalysisId, setActiveBrandForAnalysisId] = useState<string | undefined>(
    undefined,
  );
  const analysisIdKey = analysisId ?? '';
  if (analysisIdKey !== activeBrandForAnalysisId) {
    setActiveBrandForAnalysisId(analysisIdKey);
    setActiveBrand('');
  }

  const allProducts = useMemo(() => catalogProducts ?? [], [catalogProducts]);

  const handleBrandToggle = (brand: string) => {
    setActiveBrand((prev) => (prev === brand ? '' : brand));
  };

  const hasShopWithBrands = Boolean(shop?.brands.some((b) => b.trim()));

  const workflowStatus = resolveCatalogWorkflowStatus({
    analysis,
    loadingProducts: productsLoading,
    hasProducts: Boolean(catalogProducts?.length),
    error: detailError ?? productsError,
  });

  const isLoadingProducts = workflowStatus === 'loading_products';

  return (
    <>
      {analysisOpen && siteAnalysis ? (
        <AnalysisProgress analysis={siteAnalysis} onDismiss={dismissAutoAnalyze} />
      ) : null}
      <div className="relative z-[1] w-full px-12 pb-12 pt-9">
        <header className="mb-5 flex flex-wrap items-center gap-4 text-left">
          <h1 className="m-0 text-[1.75rem] font-extrabold text-text-primary">Mon catalogue</h1>
        </header>

        <div className="mb-6 flex flex-col gap-4">
          {shopLoading ? (
            <LoadingState label="Chargement de votre boutique…" />
          ) : shopError || shop === null ? (
            <ErrorState
              message={shopError ?? 'Une erreur est survenue lors du chargement de votre boutique'}
            />
          ) : (
            <ShopSummarySection
              shop={shop}
              activeBrand={activeBrand}
              onBrandClick={handleBrandToggle}
            />
          )}
        </div>

        <div className="flex flex-col gap-4">
          {productsLoading ? (
            <LoadingState label="Chargement des exemples de fiches…" />
          ) : productsError ? (
            <ErrorState message={productsError} />
          ) : catalogProducts !== null && catalogProducts.length === 0 ? (
            <EmptyProducts />
          ) : (
            <CatalogProductsSection
              shopName={shop?.name ?? ''}
              isConnected={!!profile}
              products={allProducts}
              productPayload={productPayload}
              isLoadingProducts={isLoadingProducts}
              shopBrands={hasShopWithBrands ? shop?.brands : undefined}
              defaultShopSector={shop?.sector}
              externalBrandFilter={activeBrand}
              onBrandFilterChange={setActiveBrand}
              introVariant={hasShopWithBrands ? 'shop' : 'all'}
            />
          )}
        </div>
      </div>
    </>
  );
}
