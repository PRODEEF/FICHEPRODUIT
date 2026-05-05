import { useEffect, useState } from 'react';
import {
  getAnalysisProducts,
  getSiteAnalysis,
  type ProductListResponse,
  type SiteAnalysis,
} from '../../../lib/analysisApi';
import { getAnalysisDetailCache, setAnalysisDetailCache } from '../../../lib/analysisDetailCache';
import { setLastAnalysisId } from '../../../lib/lastAnalysisIdStorage';

const CACHE_GUEST_KEY = 'guest';

type UseAnalysisDetailResult = {
  analysis: SiteAnalysis | null;
  productPayload: ProductListResponse | null;
  loading: boolean;
  error: string | null;
};

export function useAnalysisDetail(
  analysisId: string | undefined,
  userId: string | undefined,
  authLoading: boolean,
): UseAnalysisDetailResult {
  const cacheUserId = userId ?? CACHE_GUEST_KEY;

  const [loading, setLoading] = useState(() => Boolean(analysisId));
  const [analysis, setAnalysis] = useState<SiteAnalysis | null>(() => {
    if (!analysisId) return null;
    return getAnalysisDetailCache(cacheUserId, analysisId)?.analysis ?? null;
  });
  const [productPayload, setProductPayload] = useState<ProductListResponse | null>(() => {
    if (!analysisId) return null;
    return getAnalysisDetailCache(cacheUserId, analysisId)?.productPayload ?? null;
  });
  const [error, setError] = useState<string | null>(null);

  // Persiste le lastAnalysisId
  useEffect(() => {
    if (analysisId) setLastAnalysisId(analysisId);
  }, [analysisId]);

  // Réinitialise le state quand l'id change (depuis le cache ou vide)
  useEffect(() => {
    if (!analysisId || authLoading) return;
    setError(null);
    const cached = getAnalysisDetailCache(cacheUserId, analysisId);
    if (cached) {
      setAnalysis(cached.analysis);
      setProductPayload(cached.productPayload);
      setLoading(false);
    } else {
      setAnalysis(null);
      setProductPayload(null);
      setLoading(true);
    }
  }, [analysisId, authLoading, cacheUserId]);

  // Fetch réseau
  useEffect(() => {
    if (!analysisId || authLoading) return;
    let cancelled = false;

    void (async () => {
      try {
        const a = await getSiteAnalysis(analysisId);
        if (cancelled) return;
        const pl = await getAnalysisProducts(analysisId);
        if (cancelled) return;
        setAnalysis(a);
        setProductPayload(pl);
        setAnalysisDetailCache(cacheUserId, analysisId, { analysis: a, productPayload: pl });
        setError(null);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Erreur de chargement.');
          const cached = getAnalysisDetailCache(cacheUserId, analysisId);
          if (!cached) {
            setAnalysis(null);
            setProductPayload(null);
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, analysisId, authLoading, cacheUserId]);

  return { analysis, productPayload, loading, error };
}
