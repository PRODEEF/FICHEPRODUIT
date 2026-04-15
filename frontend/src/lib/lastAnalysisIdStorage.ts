const STORAGE_KEY = 'ficheproduct_last_analysis_id'

export function getLastAnalysisId(): string | null {
  try {
    const v = sessionStorage.getItem(STORAGE_KEY)
    return v && v.trim() ? v.trim() : null
  } catch {
    return null
  }
}

export function setLastAnalysisId(analysisId: string): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, analysisId)
  } catch {
    /* ignore quota / private mode */
  }
}
