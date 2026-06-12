import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';

export interface UseActiveBrandForAnalysisResult {
  activeBrand: string;
  setActiveBrand: Dispatch<SetStateAction<string>>;
}

/**
 * Filtre marque actif synchronisé avec l’analyse affichée : réinitialise la sélection
 * lorsque l’identifiant d’analyse change (ex. dernière analyse résolue côté API).
 */
export function useActiveBrandForAnalysis(
  analysisId: string | undefined,
): UseActiveBrandForAnalysisResult {
  const [activeBrand, setActiveBrand] = useState('');
  const analysisKey = analysisId ?? '';

  useEffect(() => {
    setActiveBrand('');
  }, [analysisKey]);

  return { activeBrand, setActiveBrand };
}
