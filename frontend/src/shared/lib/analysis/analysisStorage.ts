import type { ProductListResponse, SiteAnalysis } from './analysisApi';

// ─── In-memory detail cache ───────────────────────────────────────────────────

export type AnalysisDetailCacheEntry = {
  analysis: SiteAnalysis;
  productPayload: ProductListResponse;
};

const detailStore = new Map<string, AnalysisDetailCacheEntry>();

function detailCacheKey(userId: string, analysisId: string): string {
  return `${userId}:${analysisId}`;
}

export function getAnalysisDetailCache(
  userId: string,
  analysisId: string,
): AnalysisDetailCacheEntry | undefined {
  return detailStore.get(detailCacheKey(userId, analysisId));
}

export function setAnalysisDetailCache(
  userId: string,
  analysisId: string,
  entry: AnalysisDetailCacheEntry,
): void {
  detailStore.set(detailCacheKey(userId, analysisId), entry);
}

// ─── SessionStorage : last analysis ID ───────────────────────────────────────

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

export function clearLastAnalysisId(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* quota sessionStorage ou mode privé : ignorer silencieusement */
  }
}
