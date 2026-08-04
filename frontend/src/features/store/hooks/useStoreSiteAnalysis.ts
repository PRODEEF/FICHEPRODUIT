import { useCallback, useRef, useState } from 'react';

import { useSiteAnalysis } from '@shared/hooks/useSiteAnalysis';

import type { Shop } from '@types-api';

import { shopUrlsEquivalent } from '../lib/shopUrlCompare';

interface UseStoreSiteAnalysisOptions {
  shop: Shop | null;
  onSuccess: () => void;
}

/**
 * Partage le runner d’analyse entre la bannière onboarding et le bouton « Analyser le site ».
 * Affiche la modale de confirmation si l’URL a changé et que des données existent déjà.
 */
export function useStoreSiteAnalysis({ shop, onSuccess }: UseStoreSiteAnalysisOptions) {
  const { runAnalysis, analysisOpen, siteAnalysis, dismissError } = useSiteAnalysis({
    onSuccess,
  });

  const reanalysisConfirmResolveRef = useRef<((confirmed: boolean) => void) | null>(null);
  const [reanalysisModalOpen, setReanalysisModalOpen] = useState(false);

  const confirmBeforeAnalyze = useCallback(
    (url: string): Promise<boolean> => {
      if (!shop) return Promise.resolve(true);

      const urlChanged = !shopUrlsEquivalent(url, shop.url);
      const hasData = shop.brands.length > 0 || shop.categoryTree.length > 0;

      if (urlChanged && hasData) {
        setReanalysisModalOpen(true);
        return new Promise<boolean>((resolve) => {
          reanalysisConfirmResolveRef.current = resolve;
        });
      }

      return Promise.resolve(true);
    },
    [shop],
  );

  const startAnalysis = useCallback(
    async (url: string) => {
      const allowed = await confirmBeforeAnalyze(url);
      if (!allowed) return;
      await runAnalysis(url);
    },
    [confirmBeforeAnalyze, runAnalysis],
  );

  const confirmReanalysis = useCallback(() => {
    setReanalysisModalOpen(false);
    reanalysisConfirmResolveRef.current?.(true);
    reanalysisConfirmResolveRef.current = null;
  }, []);

  const cancelReanalysis = useCallback(() => {
    setReanalysisModalOpen(false);
    reanalysisConfirmResolveRef.current?.(false);
    reanalysisConfirmResolveRef.current = null;
  }, []);

  return {
    startAnalysis,
    analysisOpen,
    siteAnalysis,
    dismissError,
    reanalysisModalOpen,
    confirmReanalysis,
    cancelReanalysis,
  };
}
