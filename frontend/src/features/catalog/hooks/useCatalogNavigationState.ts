import { isValidAnalysisId } from '@lib/analysis/analysisStorage';
import { useAuth } from '@shared/hooks/useAuth';

import { useLatestSiteAnalysisId } from './useLatestSiteAnalysisId';

export interface UseCatalogNavigationStateResult {
  analysisId: string | undefined;
  hasValidAnalysisId: boolean;
  latestResolveLoading: boolean;
  latestResolveError: string | null;
  refetchLatestList: () => void;
}

/**
 * Résout l’analyse affichée sur `/catalog` pour l’utilisateur connecté
 * (dernière analyse côté API), sans segment d’URL dédié.
 */
export function useCatalogNavigationState(): UseCatalogNavigationStateResult {
  const { user, loading: authLoading } = useAuth();

  const enabled = Boolean(user?.id && !authLoading);

  const { latestId, loading: latestLoading, error: latestError, refetch } = useLatestSiteAnalysisId({
    userId: user?.id,
    enabled,
  });

  const hasValidAnalysisId = isValidAnalysisId(latestId ?? undefined);
  const analysisId = hasValidAnalysisId && latestId ? latestId : undefined;

  return {
    analysisId,
    hasValidAnalysisId,
    latestResolveLoading: enabled && latestLoading,
    latestResolveError: enabled ? latestError : null,
    refetchLatestList: refetch,
  };
}
