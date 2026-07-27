import { useEffect, useMemo } from 'react';
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router';

import { isValidAnalysisId } from '@lib/analysis/analysisStorage';
import {
  persistGuestSessionFromSources,
  resolveGuestSessionId,
} from '@lib/analysis/guestSessionStorage';

import { CatalogPageLayout } from '../components/CatalogPageLayout';
import { CatalogProductsSection } from '../components/CatalogProductsSection';
import { GuestCatalogCTA } from '../components/GuestCatalogCTA';
import { useActiveBrandForAnalysis } from '../hooks/useActiveBrandForAnalysis';
import { useAnalysisDetail } from '../hooks/useAnalysisDetail';
import { useBrandToggle } from '../lib/useBrandToggle';
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

  const { activeBrand, setActiveBrand } = useActiveBrandForAnalysis(analysisId);
  const handleBrandToggle = useBrandToggle(setActiveBrand);

  const allProducts = useMemo(() => catalogProducts ?? [], [catalogProducts]);
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

  const sessionFromQuery = searchParams.get('s');
  const guestSessionId = useMemo(
    () => resolveGuestSessionId(sessionFromQuery, analysis?.sessionId ?? null),
    [sessionFromQuery, analysis?.sessionId],
  );

  const signupWebsiteUrl = analysis?.url ?? shop?.url ?? '';

  useEffect(() => {
    persistGuestSessionFromSources(sessionFromQuery, analysis?.sessionId ?? null);
  }, [sessionFromQuery, analysis?.sessionId]);

  useEffect(() => {
    if (!analysisId || !hasValidAnalysisId || !analysisNotFound) return;
    void navigate('/', { replace: true });
  }, [analysisId, hasValidAnalysisId, analysisNotFound, navigate]);

  if (!analysisId || !hasValidAnalysisId) {
    return <Navigate to="/" replace />;
  }

  return (
    <CatalogPageLayout
      afterHeader={
        <GuestCatalogCTA websiteUrl={signupWebsiteUrl} guestSessionId={guestSessionId} />
      }
      shopLoading={shopLoading}
      shopError={shopErrorMessage}
      shop={shop}
      activeBrand={activeBrand}
      onBrandToggle={handleBrandToggle}
      productsLoading={productsLoading}
      productsError={productsError}
      productsSection={
        catalogProducts !== null && shop !== null ? (
          <CatalogProductsSection
            shopName={shop.name}
            isConnected={false}
            products={allProducts}
            productPayload={productPayload}
            isLoadingProducts={isLoadingProducts}
            shopBrands={shop.brands}
            defaultShopSector={shop.sector}
            externalBrandFilter={activeBrand}
            onBrandFilterChange={setActiveBrand}
          />
        ) : null
      }
    />
  );
}
