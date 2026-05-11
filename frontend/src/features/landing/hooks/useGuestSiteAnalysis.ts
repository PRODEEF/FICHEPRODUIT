import { useCallback, useState } from 'react';
import { toast } from 'sonner';

import type { Analysis } from '@types-api';
import { runAnalysisWorkflow } from '@api/runAnalysisWorkflow';

type UseGuestSiteAnalysisOptions = {
  onSuccess?: (analysis: Analysis) => void;
};

export type GuestRunAnalysisOutcome = 'success' | 'error_alert' | 'error_modal';

/**
 * Workflow d'analyse pour la landing (parcours invité en priorité UI).
 * Affiche la progression et gère les erreurs enrichies pour la modale.
 */
export function useGuestSiteAnalysis(options: UseGuestSiteAnalysisOptions = {}) {
  const { onSuccess } = options;
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const [siteAnalysis, setSiteAnalysis] = useState<Analysis | null>(null);

  const runAnalysis = useCallback(
    async (urlInput: string): Promise<GuestRunAnalysisOutcome> => {
      const result = await runAnalysisWorkflow(urlInput, {
        onProgress: (analysis) => {
          setAnalysisOpen(true);
          setSiteAnalysis(analysis);
        },
      });

      if (!result.ok) {
        if (!result.partial) {
          toast.error(result.error);
          setAnalysisOpen(false);
          setSiteAnalysis(null);
          return 'error_alert';
        }

        setAnalysisOpen(true);
        const partial = result.partial;
        setSiteAnalysis(
          partial.status === 'failed'
            ? partial
            : {
                ...partial,
                status: 'failed',
                errorMessage: result.error,
              },
        );
        return 'error_modal';
      }

      onSuccess?.(result.analysis);
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
