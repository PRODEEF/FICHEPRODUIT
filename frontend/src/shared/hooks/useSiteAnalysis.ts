import { useCallback, useState } from 'react';
import { toast } from 'sonner';

import type { Analysis } from '@types-api';
import { runAnalysisWorkflow } from '@api/runAnalysisWorkflow';

export type RunAnalysisOutcome = 'success' | 'error_alert' | 'error_modal';

interface UseSiteAnalysisOptions {
  onSuccess?: (analysis: Analysis) => void;
}

/**
 * Orchestre le workflow d’analyse de site dans l’UI : suivi en direct, fermeture, erreurs soit en alerte soit en modale enrichie.
 * `runAnalysis` renvoie `'success'`, `'error_alert'` ou `'error_modal'` selon le type d’échec (sans ou avec analyse partielle).
 */
export function useSiteAnalysis(options: UseSiteAnalysisOptions = {}) {
  const { onSuccess } = options;
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const [siteAnalysis, setSiteAnalysis] = useState<Analysis | null>(null);

  const runAnalysis = useCallback(
    async (urlInput: string): Promise<RunAnalysisOutcome> => {
      const result = await runAnalysisWorkflow(urlInput, {
        onProgress: (a) => {
          setAnalysisOpen(true);
          setSiteAnalysis(a);
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
        const p = result.partial;
        setSiteAnalysis({
          ...p,
          status: 'failed',
          errorMessage: result.error,
        });
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
