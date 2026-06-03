import { useEffect } from 'react';

import { AnalysisProgress } from '@shared/components/AnalysisProgress';
import { UrlSearchForm } from '@shared/components/UrlSearchForm';
import { UrlsSuggestions } from '@shared/components/UrlsSuggestions';
import { useSiteAnalysis } from '@shared/hooks/useSiteAnalysis';
import { useUrlSearch } from '@shared/hooks/useUrlSearch';
import { Button } from '@shared/ui';

export type StoreUrlAnalysisBannerVariant = 'onboarding' | 'prompt';

const VARIANT_COPY: Record<
  StoreUrlAnalysisBannerVariant,
  { title: string; description: string }
> = {
  onboarding: {
    title: 'Commencez par votre site',
    description:
      'Indiquez l’URL de votre boutique pour détecter le CMS, les marques et les catégories.',
  },
  prompt: {
    title: 'URL mise à jour',
    description:
      'Lancez une analyse pour détecter le CMS, les marques et les catégories de votre boutique.',
  },
};

interface StoreUrlAnalysisBannerProps {
  url: string;
  variant?: StoreUrlAnalysisBannerVariant;
  onDismiss: () => void;
  onAnalysisSuccess: () => void;
}

/**
 * Zone mise en avant pour saisir l’URL et lancer une analyse du magasin.
 */
export function StoreUrlAnalysisBanner({
  url,
  variant = 'onboarding',
  onDismiss,
  onAnalysisSuccess,
}: StoreUrlAnalysisBannerProps) {
  const { runAnalysis, analysisOpen, siteAnalysis, dismissError } = useSiteAnalysis({
    onSuccess: onAnalysisSuccess,
  });

  const search = useUrlSearch({ onSubmit: runAnalysis });
  const { setInput } = search;
  const copy = VARIANT_COPY[variant];

  useEffect(() => {
    setInput(url);
  }, [url, setInput]);

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
          {copy.title}
        </h2>
        <p className="mb-4 text-sm leading-6 text-text-secondary">{copy.description}</p>

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
