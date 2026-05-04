import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Navigate, useParams, useSearchParams } from 'react-router';
import { useAuth } from '../features/auth/useAuth';
import { AnalyseResult, type ResultTab } from '../components/analysis/AnalyseResult';
import { GuestAnalysisSignupCta } from '../components/analysis/GuestAnalysisSignupCta';
import {
  getAnalysisProducts,
  getSiteAnalysis,
  type ProductListResponse,
  type SiteAnalysis,
} from '../lib/analysisApi';
import { getAnalysisDetailCache, setAnalysisDetailCache } from '../lib/analysisDetailCache';
import { setLastAnalysisId } from '../lib/lastAnalysisIdStorage';

/** Clé de cache hors session pour le détail d’analyse après un flux invité. */
const ANALYSIS_DETAIL_CACHE_USER_GUEST = 'guest';

function parseResultTab(searchParams: URLSearchParams): ResultTab {
  const t = searchParams.get('tab');
  if (t === 'template') return 'template';
  return 'catalog';
}

export function Analyses() {
  const { analysisId } = useParams<{ analysisId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const prevRouteAnalysisIdRef = useRef<string | null>(null);
  const { user, loading: authLoading } = useAuth();

  const [detailLoading, setDetailLoading] = useState(() => Boolean(analysisId));
  const [analysis, setAnalysis] = useState<SiteAnalysis | null>(() => {
    if (!analysisId) return null;
    const cacheUserId = user?.id ?? ANALYSIS_DETAIL_CACHE_USER_GUEST;
    return getAnalysisDetailCache(cacheUserId, analysisId)?.analysis ?? null;
  });
  const [productPayload, setProductPayload] = useState<ProductListResponse | null>(() => {
    if (!analysisId) return null;
    const cacheUserId = user?.id ?? ANALYSIS_DETAIL_CACHE_USER_GUEST;
    return getAnalysisDetailCache(cacheUserId, analysisId)?.productPayload ?? null;
  });
  const [detailError, setDetailError] = useState<string | null>(null);

  useEffect(() => {
    if (!analysisId) return;
    setLastAnalysisId(analysisId);
  }, [analysisId]);

  useEffect(() => {
    if (!analysisId) return;
    const prev = prevRouteAnalysisIdRef.current;
    if (prev !== null && prev !== analysisId) {
      setSearchParams(
        (p) => {
          const next = new URLSearchParams(p);
          next.delete('tab');
          return next;
        },
        { replace: true },
      );
    }
    prevRouteAnalysisIdRef.current = analysisId;
  }, [analysisId, setSearchParams]);

  useLayoutEffect(() => {
    if (!analysisId || authLoading) return;
    setDetailError(null);
    const cacheUserId = user?.id ?? ANALYSIS_DETAIL_CACHE_USER_GUEST;
    const cached = getAnalysisDetailCache(cacheUserId, analysisId);
    if (cached) {
      setAnalysis(cached.analysis);
      setProductPayload(cached.productPayload);
      setDetailLoading(false);
    } else {
      setAnalysis(null);
      setProductPayload(null);
      setDetailLoading(true);
    }
  }, [analysisId, authLoading, user?.id]);

  useEffect(() => {
    if (!analysisId || authLoading) return;
    const cacheUserId = user?.id ?? ANALYSIS_DETAIL_CACHE_USER_GUEST;
    let cancelled = false;

    void (async () => {
      try {
        const a = await getSiteAnalysis(analysisId);
        if (cancelled) return;
        const pl = await getAnalysisProducts(analysisId);
        if (cancelled) return;
        setAnalysis(a);
        setProductPayload(pl);
        setAnalysisDetailCache(cacheUserId, analysisId, {
          analysis: a,
          productPayload: pl,
        });
        setDetailError(null);
      } catch (e) {
        if (!cancelled) {
          setDetailError(e instanceof Error ? e.message : 'Erreur de chargement.');
          const cached = getAnalysisDetailCache(cacheUserId, analysisId);
          if (!cached) {
            setAnalysis(null);
            setProductPayload(null);
          }
        }
      } finally {
        if (!cancelled) setDetailLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id, analysisId, authLoading]);

  if (authLoading) {
    return (
      <div className="app-content analyses-page">
        <p className="analyses-status" aria-busy="true">
          Chargement…
        </p>
      </div>
    );
  }

  if (!analysisId) {
    return <Navigate to="/" replace />;
  }

  const resultTab = parseResultTab(searchParams);
  const setResultTab = (tab: ResultTab) => {
    setSearchParams(
      (p) => {
        const next = new URLSearchParams(p);
        if (tab === 'catalog') {
          next.delete('tab');
        } else {
          next.set('tab', 'template');
        }
        return next;
      },
      { replace: true },
    );
  };

  return (
    <div className="app-content analyses-page">
      <header className="analyses-header">
        <h1 className="analyses-title">Résultat de l&apos;analyse</h1>
      </header>

      {!user && !detailLoading && !detailError && analysis?.status === 'completed' ? (
        <GuestAnalysisSignupCta websiteUrl={analysis.url} />
      ) : null}

      <AnalyseResult
        loading={detailLoading}
        error={detailError}
        analysis={analysis}
        productPayload={productPayload}
        activeTab={resultTab}
        onActiveTabChange={setResultTab}
      />
    </div>
  );
}
