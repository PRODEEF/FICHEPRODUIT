import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router';

import { isValidAnalysisId, isValidGuestSessionId } from '@lib/analysis/analysisStorage';
import { setGuestSessionId } from '@lib/analysis/guestSessionStorage';

import { CatalogProductsSection } from '../components/CatalogProductsSection';
import { EmptyProducts } from '../components/EmptyProducts';
import { ErrorState, LoadingState } from '../components/CatalogSectionStates';
import { GuestCatalogCTA } from '../components/GuestCatalogCTA';
import { ShopSummarySection } from '../components/ShopSummarySection';
import { useAnalysisDetail } from '../hooks/useAnalysisDetail';
import { resolveCatalogWorkflowStatus } from '../lib/catalogWorkflowStatus';

/**
 * Vue publique d’une analyse pour les invités non connectés (`/catalog/public/:analysisId`),
 * typiquement après une analyse : la boutique vient d’être créée et les fiches exemples sont
 * les mêmes blocs que sur `/catalog`, avec un rappel d’inscription.
 *
 * Toute analyse introuvable ou identifiant invalide redirige vers l’accueil.
 */
export function PublicCatalog() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { analysisId } = useParams<{ analysisId: string }>();

  const hasValidAnalysisId = isValidAnalysisId(analysisId);

  const {
    analysis,
    shop,
    products: catalogProducts,
    productPayload,
    error: detailError,
    analysisNotFound,
    analysisShopLoading,
    catalogProductsLoading,
  } = useAnalysisDetail(analysisId, undefined, false);

  const [activeBrand, setActiveBrand] = useState('');
  const [activeBrandForAnalysisId, setActiveBrandForAnalysisId] = useState<string | undefined>(
    undefined,
  );
  const analysisIdKey = analysisId !== undefined && analysisId !== '' ? analysisId : '';
  if (analysisIdKey !== activeBrandForAnalysisId) {
    setActiveBrandForAnalysisId(analysisIdKey);
    setActiveBrand('');
  }

  const allProducts = useMemo(() => catalogProducts ?? [], [catalogProducts]);

  const handleBrandToggle = (brand: string) => {
    setActiveBrand((prev) => (prev === brand ? '' : brand));
  };

  const hasShopWithBrands = Boolean(shop?.brands.some((b) => b.trim()));

  const shopLoading = analysisShopLoading || (analysis !== null && analysis.status !== 'done');

  const shopErrorMessage =
    !shopLoading && shop === null
      ? (detailError ?? 'Une erreur est survenue lors du chargement de votre boutique')
      : null;

  const productsLoading = shop !== null && analysis?.status === 'done' && catalogProductsLoading;

  const productsError = shop !== null ? detailError : null;

  const workflowStatus = resolveCatalogWorkflowStatus({
    analysis,
    loadingProducts: catalogProductsLoading,
    hasProducts: Boolean(catalogProducts?.length),
    error: detailError,
  });

  const isLoadingProducts = workflowStatus === 'loading_products';

  const signupWebsiteUrl = analysis?.url ?? shop?.url ?? '';

  useEffect(() => {
    const fromQuery = searchParams.get('s');
    if (isValidGuestSessionId(fromQuery)) {
      setGuestSessionId(fromQuery);
      return;
    }
    if (analysis?.sessionId) {
      setGuestSessionId(analysis.sessionId);
    }
  }, [searchParams, analysis?.sessionId]);

  useEffect(() => {
    if (!analysisId || !hasValidAnalysisId || !analysisNotFound) return;
    void navigate('/', { replace: true });
  }, [analysisId, hasValidAnalysisId, analysisNotFound, navigate]);

  if (!analysisId || !hasValidAnalysisId) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="relative z-[1] w-full px-12 pb-12 pt-9">
      <header className="mb-5 flex flex-wrap items-center gap-4 text-left">
        <h1 className="m-0 text-[1.75rem] font-extrabold text-text-primary">Mon catalogue</h1>
      </header>

      <GuestCatalogCTA websiteUrl={signupWebsiteUrl} />

      <div className="mb-6 flex flex-col gap-4">
        {shopLoading ? (
          <LoadingState label="Chargement de votre boutique…" />
        ) : shopErrorMessage !== null || shop === null ? (
          <ErrorState
            message={
              shopErrorMessage ?? 'Une erreur est survenue lors du chargement de votre boutique'
            }
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
        {shop === null ? null : productsLoading ? (
          <LoadingState label="Chargement des exemples de fiches…" />
        ) : productsError ? (
          <ErrorState message={productsError} />
        ) : catalogProducts !== null && catalogProducts.length === 0 ? (
          <EmptyProducts />
        ) : (
          <CatalogProductsSection
            shopName={shop.name}
            isConnected={false}
            products={allProducts}
            productPayload={productPayload}
            isLoadingProducts={isLoadingProducts}
            shopBrands={hasShopWithBrands ? shop.brands : undefined}
            defaultShopSector={shop.sector}
            externalBrandFilter={activeBrand}
            onBrandFilterChange={setActiveBrand}
            introVariant={hasShopWithBrands ? 'shop' : 'all'}
          />
        )}
      </div>
    </div>
  );
}
