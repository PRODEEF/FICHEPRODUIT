import { useCallback, useState } from 'react';

import type { Analysis } from '@types-api';
import { runAnalysisWorkflow } from '@api/runAnalysisWorkflow';

type UseCatalogAnalysisWorkflowOptions = {
  onSuccess?: (analysis: Analysis) => void;
};

type UseCatalogAnalysisWorkflowResult = {
  run: (urlInput: string) => Promise<void>;
  running: boolean;
  currentAnalysis: Analysis | null;
  error: string | null;
  clearError: () => void;
};

export function useCatalogAnalysisWorkflow(
  options: UseCatalogAnalysisWorkflowOptions = {},
): UseCatalogAnalysisWorkflowResult {
  const { onSuccess } = options;
  const [running, setRunning] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState<Analysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    async (urlInput: string) => {
      setRunning(true);
      setError(null);
      setCurrentAnalysis(null);

      const result = await runAnalysisWorkflow(urlInput, {
        onProgress: (analysis) => setCurrentAnalysis(analysis),
      });

      if (!result.ok) {
        setError(result.error);
        if (result.partial) {
          setCurrentAnalysis(result.partial);
        }
        setRunning(false);
        return;
      }

      onSuccess?.(result.analysis);
      setCurrentAnalysis(null);
      setRunning(false);
    },
    [onSuccess],
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return { run, running, currentAnalysis, error, clearError };
}
