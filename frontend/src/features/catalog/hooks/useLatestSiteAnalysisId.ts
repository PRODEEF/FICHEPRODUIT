import { useCallback, useEffect, useState } from 'react';

import { listAnalyses } from '@api/analysis';
import { apiErrorMessage } from '@lib/apiErrorMessage';
import { pickLatestSiteAnalysisId } from '../lib/latestSiteAnalysis';

export interface UseLatestSiteAnalysisIdOptions {
  userId: string | undefined;
  enabled: boolean;
}

export interface UseLatestSiteAnalysisIdResult {
  latestId: string | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Charge la liste des analyses du compte et déduit l’identifiant de la plus récente.
 */
export function useLatestSiteAnalysisId(
  options: UseLatestSiteAnalysisIdOptions,
): UseLatestSiteAnalysisIdResult {
  const { userId, enabled } = options;
  const [fetchVersion, setFetchVersion] = useState(0);
  const [latestId, setLatestId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(() => {
    setFetchVersion((v) => v + 1);
  }, []);

  useEffect(() => {
    const guard = { cancelled: false };

    void (async () => {
      await Promise.resolve();
      if (!userId || !enabled) {
        setLatestId(null);
        setLoading(false);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const list = await listAnalyses();
        if (guard.cancelled) return;
        setLatestId(pickLatestSiteAnalysisId(list));
        setError(null);
      } catch (e) {
        if (!guard.cancelled) {
          const message = apiErrorMessage(e, 'Erreur de chargement.');
          setError(message);
          setLatestId(null);
        }
      } finally {
        if (!guard.cancelled) setLoading(false);
      }
    })();

    return () => {
      guard.cancelled = true;
    };
  }, [userId, enabled, fetchVersion]);

  return { latestId, loading, error, refetch };
}
