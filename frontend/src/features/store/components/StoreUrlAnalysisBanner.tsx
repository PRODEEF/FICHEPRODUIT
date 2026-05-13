import { useEffect } from 'react';

import { AnalysisProgress } from '@shared/components/AnalysisProgress';
import { UrlSearchForm } from '@shared/components/UrlSearchForm';
import { UrlsSuggestions } from '@shared/components/UrlsSuggestions';
import { useSiteAnalysis } from '@shared/hooks/useSiteAnalysis';
import { useUrlSearch } from '@shared/hooks/useUrlSearch';
import { Button } from '@shared/ui';

interface StoreUrlAnalysisBannerProps {
  url: string;
  onDismiss: () => void;
  onAnalysisSuccess: () => void;
}

/**
 * Invite à lancer une analyse après modification de l’URL du magasin.
 */
export function StoreUrlAnalysisBanner({
  url,
  onDismiss,
  onAnalysisSuccess,
}: StoreUrlAnalysisBannerProps) {
  const { runAnalysis, analysisOpen, siteAnalysis, dismissError } = useSiteAnalysis({
    onSuccess: onAnalysisSuccess,
  });

  const search = useUrlSearch({ onSubmit: runAnalysis });

  useEffect(() => {
    search.setInput(url);
  }, [url, search.setInput]);

  return (
    <>
      {analysisOpen && siteAnalysis ? (
        <AnalysisProgress analysis={siteAnalysis} onDismiss={dismissError} />
      ) : null}

      <section
        className="mb-6 overflow-hidden rounded-xl border border-border-purple bg-purple-50 px-4 py-4 text-left"
        role="region"
        aria-labelledby="store-url-analysis-title"
      >
        <h2 id="store-url-analysis-title" className="mb-1 text-sm font-semibold text-text-primary">
          URL mise à jour
        </h2>
        <p className="mb-4 text-sm leading-6 text-text-secondary">
          Lancez une analyse pour détecter le CMS, les marques et les catégories de votre boutique.
        </p>

        <UrlSearchForm
          siteInput={search.input}
          setSiteInput={search.setInput}
          suggestionsLoading={search.suggestionsLoading}
          searchEmptyError={search.inputEmptyError}
          handleSubmit={() => {
            void search.handleSubmit();
          }}
          align="left"
        />

        <UrlsSuggestions
          urls={search.suggestedUrls}
          onPick={(picked) => {
            void search.handlePickSuggestion(picked);
          }}
        />

        <div className="mt-2">
          <Button type="button" variant="neutral-outline" size="sm" onClick={onDismiss}>
            Plus tard
          </Button>
        </div>
      </section>
    </>
  );
}
