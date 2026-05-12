/**
 * Utilitaires pour le parcours catalogue / analyses (sans localStorage ni sessionStorage).
 * Cache mémoire court pour éviter un flash vide entre deux rendus sur la même analyse.
 */

const ANALYSIS_DETAIL_CACHE = new Map<string, unknown>();

/** UUID (RFC) — aligné sur les IDs générés côté backend. */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function detailCacheKey(userId: string, analysisId: string): string {
  return `${userId}:${analysisId}`;
}

export function isValidAnalysisId(id: string | undefined): id is string {
  return typeof id === 'string' && id.length > 0 && UUID_RE.test(id);
}

/** UUID de session invité (même format qu’un id d’analyse). */
export function isValidGuestSessionId(id: string | null | undefined): id is string {
  return isValidAnalysisId(id ?? undefined);
}

interface AnalysisDetailCache<A, P, S> {
  analysis: A;
  productPayload?: P;
  shop?: S;
}

export function getAnalysisDetailCache<A, P, S = unknown>(
  userId: string,
  analysisId: string,
): AnalysisDetailCache<A, P, S> | null {
  const raw = ANALYSIS_DETAIL_CACHE.get(detailCacheKey(userId, analysisId));
  if (!raw || typeof raw !== 'object' || !('analysis' in raw)) return null;
  return raw as AnalysisDetailCache<A, P, S>;
}

export function setAnalysisDetailCache<A, P, S = unknown>(
  userId: string,
  analysisId: string,
  data: AnalysisDetailCache<A, P, S>,
): void {
  ANALYSIS_DETAIL_CACHE.set(detailCacheKey(userId, analysisId), data);
}
