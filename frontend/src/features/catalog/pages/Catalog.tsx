import { Navigate, useNavigate } from 'react-router';

import { useAuth } from '@shared/hooks/useAuth';

import { EmptyAnalysis } from '../components/EmptyAnalysis';
import { AnalysisResult } from '../components/AnalysisResult';
import { useCatalogAnalysis } from '../hooks/useCatalogAnalysis';
import { useCatalogAnalysisWorkflow } from '../hooks/useCatalogAnalysisWorkflow';
import { useCatalogUrlInputFlow } from '../hooks/useCatalogUrlInputFlow';

/**
 * Catalogue privé de l'utilisateur connecté.
 *
 * Le rendu varie selon l'URL :
 * - `/catalog` (sans id) : affiche la zone de saisie pour lancer une nouvelle analyse.
 * - `/catalog/:analysisId` : affiche le détail d'une analyse existante.
 */
export function Catalog() {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const {
    analysisId,
    hasValidAnalysisId,
    analysis,
    shop,
    products,
    productPayload,
    detailLoading,
    detailError,
    latestResolveLoading,
    latestResolveError,
  } = useCatalogAnalysis();

  const { run, running, currentAnalysis, error: workflowError, clearError } = useCatalogAnalysisWorkflow({
    onSuccess: (nextAnalysis) => navigate(`/catalog/${nextAnalysis.id}`),
  });
  const search = useCatalogUrlInputFlow({
    analysisId,
    defaultWebsiteUrl: profile?.website_url,
    onSubmit: run,
  });

  if (analysisId && !hasValidAnalysisId) {
    return <Navigate to="/catalog" replace />;
  }

  if (!analysisId) {
    return (
      <>
        <div className="relative z-[1] w-full px-12 pb-12 pt-9">
          <header className="mb-5 flex flex-wrap items-center gap-4 text-left">
            <h1 className="m-0 text-[1.75rem] font-extrabold text-text-primary">Mon catalogue</h1>
          </header>
          {running ? (
            <p className="mb-4 text-sm text-text-secondary" aria-busy="true">
              Analyse en cours... statut actuel : {currentAnalysis?.status ?? 'pending'}
            </p>
          ) : null}
          {workflowError ? (
            <div
              className="mb-4 rounded-xl border border-red-500/35 bg-red-50 px-4 py-3 text-text-primary"
              role="alert"
            >
              <p>{workflowError}</p>
              <button
                type="button"
                className="mt-2 text-sm font-semibold text-purple-600 underline-offset-2 hover:underline"
                onClick={clearError}
              >
                Fermer
              </button>
            </div>
          ) : null}
          {latestResolveLoading ? (
            <p className="text-sm text-text-secondary" aria-busy="true">
              Chargement…
            </p>
          ) : (
            <>
              {latestResolveError ? (
                <div
                  className="mb-4 rounded-xl border border-border-purple bg-purple-50 px-4 py-3 text-text-primary"
                  role="alert"
                >
                  {latestResolveError}
                </div>
              ) : null}
              <EmptyAnalysis
                siteInput={search.input}
                setSiteInput={search.setInput}
                suggestionsLoading={search.suggestionsLoading}
                searchEmptyError={search.inputEmptyError}
                handleSubmit={search.handleSubmit}
                suggestedUrls={search.suggestedUrls}
                handlePickSuggestion={search.handlePickSuggestion}
              />
            </>
          )}
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
        isConnected={!!profile}
        loading={detailLoading}
        error={detailError}
        analysis={analysis}
        shop={shop}
        products={products}
        productPayload={productPayload}
      />
    </div>
  );
}
