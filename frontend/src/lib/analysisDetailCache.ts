import type { ProductListResponse, SiteAnalysis } from './analysisApi'

export type AnalysisDetailCacheEntry = {
  analysis: SiteAnalysis
  productPayload: ProductListResponse
}

const store = new Map<string, AnalysisDetailCacheEntry>()

function cacheKey(userId: string, analysisId: string): string {
  return `${userId}:${analysisId}`
}

export function getAnalysisDetailCache(
  userId: string,
  analysisId: string,
): AnalysisDetailCacheEntry | undefined {
  return store.get(cacheKey(userId, analysisId))
}

export function setAnalysisDetailCache(
  userId: string,
  analysisId: string,
  entry: AnalysisDetailCacheEntry,
): void {
  store.set(cacheKey(userId, analysisId), entry)
}
