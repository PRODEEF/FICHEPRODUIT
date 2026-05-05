const STORAGE_KEY = 'ficheproduct_last_analysis_id';
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidAnalysisId(value: string | null | undefined): value is string {
  return typeof value === 'string' && UUID_RE.test(value.trim());
}

export function getLastAnalysisId(): string | null {
  try {
    const v = sessionStorage.getItem(STORAGE_KEY);
    const parsed = v?.trim();
    if (!parsed) return null;
    return isValidAnalysisId(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function setLastAnalysisId(analysisId: string): void {
  if (!isValidAnalysisId(analysisId)) return;
  try {
    sessionStorage.setItem(STORAGE_KEY, analysisId);
  } catch {
    /* quota sessionStorage ou mode privé : ignorer silencieusement */
  }
}
