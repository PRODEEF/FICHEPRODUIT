import { useEffect, useRef } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router';

import { clearLastAnalysisId, isValidAnalysisId } from '@lib/analysis/analysisStorage';

import { useSiteAnalysis } from '../../../shared/hooks/useSiteAnalysis';
import { useAuth } from '../../auth/useAuth';
import { AnalysisProgress } from '../../landing/components/AnalysisProgress';
import { useLandingSearch } from '../../landing/hooks/useLandingSearch';
import { AnalysisResult } from '../components/AnalysisResult';
import { EmptyAnalysis } from '../components/EmptyAnalysis';
import { useAnalysisDetail } from '../hooks/useAnalysisDetail';

/**
 * Catalogue privé de l'utilisateur connecté.
 *
 * Le rendu varie selon l'URL :
 * - `/catalog` (sans id) : affiche la zone de saisie pour lancer une nouvelle analyse.
 * - `/catalog/:analysisId` : affiche le détail d'une analyse existante.
 */
export function Catalog() {
  const navigate = useNavigate();
  const { analysisId } = useParams<{ analysisId: string }>();
  const { user, profile } = useAuth();

  const { runAnalysis, analysisOpen, siteAnalysis, dismissError } = useSiteAnalysis({
    onSuccess: (summary) => navigate(`/catalog/${summary.id}`),
  });
  const landing = useLandingSearch({ runAnalysis });

  const defaultSiteFromProfileApplied = useRef(false);
  const hasValidAnalysisId = isValidAnalysisId(analysisId);

  useEffect(() => {
    if (analysisId) return;
    if (defaultSiteFromProfileApplied.current) return;
    const fromProfile = profile?.website_url?.trim();
    if (landing.siteInput.trim() !== '') {
      defaultSiteFromProfileApplied.current = true;
      return;
    }
    if (!fromProfile) return;
    defaultSiteFromProfileApplied.current = true;
    landing.setSiteInput(fromProfile);
  }, [analysisId, profile?.website_url, landing.siteInput, landing.setSiteInput]);

  const {
    analysis,
    productPayload,
    loading: detailLoading,
    error: detailError,
    analysisNotFound,
  } = useAnalysisDetail(analysisId, user?.id, false);

  useEffect(() => {
    if (!analysisId || !hasValidAnalysisId || !analysisNotFound) return;
    clearLastAnalysisId();
    navigate('/catalog', { replace: true });
  }, [analysisId, hasValidAnalysisId, analysisNotFound, navigate]);

  if (analysisId && !hasValidAnalysisId) {
    return <Navigate to="/catalog" replace />;
  }

  if (!analysisId) {
    return (
      <>
        {analysisOpen && siteAnalysis ? (
          <AnalysisProgress analysis={siteAnalysis} onDismiss={dismissError} />
        ) : null}
        <div className="relative z-[1] w-full px-12 pb-12 pt-9">
          <header className="mb-5 flex flex-wrap items-center gap-4 text-left">
            <h1 className="m-0 text-[1.75rem] font-extrabold text-text-primary">Mon catalogue</h1>
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
    <div className="relative z-[1] w-full px-12 pb-12 pt-9">
      <header className="mb-5 flex flex-wrap items-center gap-4 text-left">
        <h1 className="m-0 text-[1.75rem] font-extrabold text-text-primary">Mon catalogue</h1>
      </header>

      <AnalysisResult
        loading={detailLoading}
        error={detailError}
        analysis={analysis}
        productPayload={productPayload}
      />
    </div>
  );
}
