import { useEffect } from 'react';
import { useNavigate } from 'react-router';

import { useAuth } from '@shared/hooks/useAuth';

import { useAnalysisDetail } from './useAnalysisDetail';
import { useCatalogNavigationState } from './useCatalogNavigationState';

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
 * détail par URL, redirection vers la plus récente sur `/catalog`, nettoyage si introuvable.
 */
export function useCatalogAnalysis(): UseCatalogAnalysisResult {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { analysisId, hasValidAnalysisId, latestResolveLoading, latestResolveError } =
    useCatalogNavigationState();

  const {
    analysis,
    shop,
    productPayload,
    products,
    loading: detailLoading,
    error: detailError,
    analysisNotFound,
  } = useAnalysisDetail(analysisId, user?.id, authLoading);

  useEffect(() => {
    if (!analysisId || !hasValidAnalysisId || !analysisNotFound) return;
    void navigate('/catalog', { replace: true });
  }, [analysisId, hasValidAnalysisId, analysisNotFound, navigate]);

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
    refetchLatestList: () => undefined,
  };
}
