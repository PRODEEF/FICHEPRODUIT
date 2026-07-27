import { useState, type Dispatch, type SetStateAction } from 'react';

export interface UseActiveBrandForAnalysisResult {
  activeBrand: string;
  setActiveBrand: Dispatch<SetStateAction<string>>;
}

/**
 * Filtre marque actif synchronisé avec l'analyse affichée : réinitialise la sélection
 * lorsque l'identifiant d'analyse change (ex. dernière analyse résolue côté API).
 * Utilise le pattern "derived state during render" pour éviter un setState dans un effet.
 */
export function useActiveBrandForAnalysis(
  analysisId: string | undefined,
): UseActiveBrandForAnalysisResult {
  const analysisKey = analysisId ?? '';
  const [activeBrand, setActiveBrand] = useState('');
  const [prevAnalysisKey, setPrevAnalysisKey] = useState(analysisKey);

  if (prevAnalysisKey !== analysisKey) {
    setPrevAnalysisKey(analysisKey);
    setActiveBrand('');
  }

  return { activeBrand, setActiveBrand };
}
