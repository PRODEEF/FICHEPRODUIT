import { useEffect, useRef } from 'react';
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router';
import { useAuth } from '../../auth/useAuth';
import { AnalyseResult } from '../../../components/analysis/AnalyseResult';
import { GuestAnalysisSignupCta } from '../../../components/analysis/GuestAnalysisSignupCta';
import { AnalysisProgress } from '../../landing/components/AnalysisProgress';
import { EmptyAnalysis } from '../components/EmptyAnalysis';
import {
  clearLastAnalysisId,
  isValidAnalysisId,
  setLastAnalysisId,
} from '../../../lib/lastAnalysisIdStorage';
import { useSiteAnalysis } from '../../../shared/hooks/useSiteAnalysis';
import { useLandingSearch } from '../../landing/hooks/useLandingSearch';
import { useAnalysisDetail } from '../hooks/useAnalysisDetail';
import { useResultTab } from '../hooks/useResultTab';

export function Catalog() {
  const navigate = useNavigate();
  const { analysisId } = useParams<{ analysisId: string }>();
  const [, setSearchParams] = useSearchParams();
  const prevAnalysisIdRef = useRef<string | null>(null);
  const { user, loading: authLoading } = useAuth();

  const { runAnalysis, analysisOpen, siteAnalysis, dismissError } = useSiteAnalysis({
    onSuccess: (summary) => navigate(`/catalog/${summary.id}?tab=catalog`),
  });
  const landing = useLandingSearch({ runAnalysis });

  const hasValidAnalysisId = isValidAnalysisId(analysisId);

  const {
    analysis,
    productPayload,
    loading: detailLoading,
    error: detailError,
    analysisNotFound,
  } = useAnalysisDetail(analysisId, user?.id, authLoading);

  const { tab: resultTab, setTab: setResultTab } = useResultTab();

  useEffect(() => {
    if (!analysisId || !hasValidAnalysisId) return;
    setLastAnalysisId(analysisId);
  }, [analysisId, hasValidAnalysisId]);

  useEffect(() => {
    if (!analysisId || !hasValidAnalysisId || !analysisNotFound) return;
    clearLastAnalysisId();
    navigate('/catalog?tab=catalog', { replace: true });
  }, [analysisId, hasValidAnalysisId, analysisNotFound, navigate]);

  // Reset tab quand on navigue vers une autre analyse
  useEffect(() => {
    if (!analysisId || !hasValidAnalysisId) return;
    const prev = prevAnalysisIdRef.current;
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
    prevAnalysisIdRef.current = analysisId;
  }, [analysisId, hasValidAnalysisId, setSearchParams]);

  if (authLoading) {
    return (
      <div className="app-content dashboard-content">
        <p className="analyses-status" aria-busy="true">
          Chargement…
        </p>
      </div>
    );
  }

  if (analysisId && !hasValidAnalysisId) {
    return <Navigate to="/catalog" replace />;
  }

  if (!analysisId) {
    if (!user) return <Navigate to="/" replace />;
    return (
      <>
        {analysisOpen && siteAnalysis ? (
          <AnalysisProgress analysis={siteAnalysis} onDismiss={dismissError} />
        ) : null}
        <div className="app-content dashboard-content">
          <header className="analyses-header">
            <h1 className="analyses-title">Mon catalogue</h1>
          </header>
          <EmptyAnalysis
            siteInput={landing.siteInput}
            setSiteInput={landing.setSiteInput}
            suggestionsLoading={landing.suggestionsLoading}
            searchEmptyError={landing.searchEmptyError}
            handleSubmit={landing.handleSubmit}
            suggestedUrls={landing.suggestedUrls}
            handlePickSuggestion={landing.handlePickSuggestion}
          />
        </div>
      </>
    );
  }

  return (
    <div className="app-content dashboard-content">
      <header className="analyses-header">
        <h1 className="analyses-title">Mon catalogue</h1>
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
