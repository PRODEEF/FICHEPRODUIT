import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import type { SiteAnalysis } from '@lib/analysis/analysisApi';
import { runSiteAnalysisWorkflow } from '@lib/analysis/runSiteAnalysisWorkflow';

type SiteAnalysisSummary = {
  id: string;
  url: string;
  cms?: string;
  verticalSummary?: string;
  catalogMatchCategories?: string[];
  mainBrands?: string[];
};

export type RunAnalysisOutcome = 'success' | 'error_alert' | 'error_modal';

type UseSiteAnalysisOptions = {
  onSuccess?: (summary: SiteAnalysisSummary) => void;
};

/**
 * Orchestre le workflow d’analyse de site dans l’UI : suivi en direct, fermeture, erreurs soit en alerte soit en modale enrichie.
 * `runAnalysis` renvoie `'success'`, `'error_alert'` ou `'error_modal'` selon le type d’échec (sans ou avec analyse partielle).
 */
export function useSiteAnalysis(options: UseSiteAnalysisOptions = {}) {
  const { onSuccess } = options;
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const [siteAnalysis, setSiteAnalysis] = useState<SiteAnalysis | null>(null);

  const runAnalysis = useCallback(
    async (urlInput: string): Promise<RunAnalysisOutcome> => {
      const result = await runSiteAnalysisWorkflow(urlInput, {
        onProgress: (a) => {
          setAnalysisOpen(true);
          setSiteAnalysis(a);
        },
      });

      if (result.ok === false) {
        if (!result.partial) {
          toast.error(result.error);
          setAnalysisOpen(false);
          setSiteAnalysis(null);
          return 'error_alert';
        }

        setAnalysisOpen(true);
        const p = result.partial;
        if (p.status === 'failed') {
          setSiteAnalysis(p);
        } else {
          setSiteAnalysis({
            ...p,
            status: 'failed',
            errorMessage: result.error,
          });
        }
        return 'error_modal';
      }

      const summary = result.summary;
      onSuccess?.(summary);
      setAnalysisOpen(false);
      setSiteAnalysis(null);
      return 'success';
    },
    [onSuccess],
  );

  const dismissError = useCallback(() => {
    setAnalysisOpen(false);
    setSiteAnalysis(null);
  }, []);

  return {
    runAnalysis,
    analysisOpen,
    siteAnalysis,
    dismissError,
  };
}
