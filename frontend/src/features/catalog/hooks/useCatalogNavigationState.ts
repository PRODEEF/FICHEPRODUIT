import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';

import { isValidAnalysisId } from '@lib/analysis/analysisStorage';
import { useAuth } from '@shared/hooks/useAuth';

import { useLatestSiteAnalysisId } from './useLatestSiteAnalysisId';

type UseCatalogNavigationStateResult = {
  analysisId: string | undefined;
  hasValidAnalysisId: boolean;
  latestResolveLoading: boolean;
  latestResolveError: string | null;
};

/**
 * État d’URL du catalogue connecté : `/catalog` ou `/catalog/:analysisId`.
 * Sans id en URL, redirige vers la dernière analyse listée côté API (utilisateur connecté uniquement).
 */
export function useCatalogNavigationState(): UseCatalogNavigationStateResult {
  const navigate = useNavigate();
  const { analysisId } = useParams<{ analysisId: string }>();
  const { user, loading: authLoading } = useAuth();

  const hasValidAnalysisId = isValidAnalysisId(analysisId);
  const shouldResolveLatest = Boolean(!analysisId && user?.id && !authLoading);

  const { latestId, loading: latestLoading, error: latestError } = useLatestSiteAnalysisId({
    userId: user?.id,
    enabled: shouldResolveLatest,
  });

  useEffect(() => {
    if (!shouldResolveLatest || latestLoading || !latestId) return;
    navigate(`/catalog/${latestId}`, { replace: true });
  }, [latestId, latestLoading, navigate, shouldResolveLatest]);

  return {
    analysisId,
    hasValidAnalysisId,
    latestResolveLoading: shouldResolveLatest && latestLoading,
    latestResolveError: shouldResolveLatest ? latestError : null,
  };
}
