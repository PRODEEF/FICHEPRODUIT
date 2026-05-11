import { useCallback, useEffect, useState } from 'react';

import { listAnalyses } from '@api/analysis';
import { pickLatestSiteAnalysisId } from '../lib/latestSiteAnalysis';

export type UseLatestSiteAnalysisIdOptions = {
  userId: string | undefined;
  enabled: boolean;
};

export type UseLatestSiteAnalysisIdResult = {
  latestId: string | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
};

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
    let cancelled = false;

    if (!userId || !enabled) {
      setLatestId(null);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    void (async () => {
      try {
        const list = await listAnalyses();
        if (cancelled) return;
        setLatestId(pickLatestSiteAnalysisId(list));
        setError(null);
      } catch (e) {
        if (!cancelled) {
          const message = e instanceof Error ? e.message : 'Erreur de chargement.';
          setError(message);
          setLatestId(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, enabled, fetchVersion]);

  return { latestId, loading, error, refetch };
}
