import { useEffect } from 'react';

import { useAuth } from '@shared/hooks/useAuth';

import { useAnalysisDetail } from './useAnalysisDetail';
import { useCatalogNavigationState } from './useCatalogNavigationState';

export interface UseCatalogAnalysisOptions {
  /** Si `true`, le détail d’analyse ne déclenche pas `useCatalogProductsByIds` (page catalogue connectée). */
  skipProductFetch?: boolean;
}

export interface UseCatalogAnalysisResult {
  analysisId: string | undefined;
  hasValidAnalysisId: boolean;
  analysis: ReturnType<typeof useAnalysisDetail>['analysis'];
  shop: ReturnType<typeof useAnalysisDetail>['shop'];
  products: ReturnType<typeof useAnalysisDetail>['products'];
  productPayload: ReturnType<typeof useAnalysisDetail>['productPayload'];
  detailLoading: boolean;
  detailError: string | null;
  analysisNotFound: boolean;
  latestResolveLoading: boolean;
  latestResolveError: string | null;
  refetchLatestList: () => void;
}

/**
 * Centralise la logique catalogue autour de l’analyse courante :
 * dernière analyse du compte sur `/catalog`, rafraîchissement de la liste si détail introuvable.
 */
export function useCatalogAnalysis(options?: UseCatalogAnalysisOptions): UseCatalogAnalysisResult {
  const { user, loading: authLoading } = useAuth();
  const {
    analysisId,
    hasValidAnalysisId,
    latestResolveLoading,
    latestResolveError,
    refetchLatestList,
  } = useCatalogNavigationState();

  const loadProducts = !options?.skipProductFetch;

  const {
    analysis,
    shop,
    productPayload,
    products,
    loading: detailLoading,
    error: detailError,
    analysisNotFound,
  } = useAnalysisDetail(analysisId, user?.id, authLoading, { loadProducts });

  useEffect(() => {
    if (!analysisId || !hasValidAnalysisId || !analysisNotFound) return;
    refetchLatestList();
  }, [analysisId, hasValidAnalysisId, analysisNotFound, refetchLatestList]);

  return {
    analysisId,
    hasValidAnalysisId,
    analysis,
    shop,
    productPayload,
    products,
    detailLoading,
    detailError,
    analysisNotFound,
    latestResolveLoading,
    latestResolveError,
    refetchLatestList,
  };
}
