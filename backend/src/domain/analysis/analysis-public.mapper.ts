import type { Analysis } from "./analysis.types";

/**
 * Vue API d'une analyse : le `sessionId` interne n'est jamais exposé au client
 * (session invité = cookie httpOnly uniquement).
 */
export type PublicAnalysis = Omit<Analysis, "sessionId">;

export function toPublicAnalysis(analysis: Analysis): PublicAnalysis {
  return {
    id: analysis.id,
    url: analysis.url,
    status: analysis.status,
    errorCode: analysis.errorCode,
    errorMessage: analysis.errorMessage,
    userId: analysis.userId,
    shopId: analysis.shopId,
    createdAt: analysis.createdAt,
  };
}

export function toPublicAnalyses(analyses: Analysis[]): PublicAnalysis[] {
  return analyses.map(toPublicAnalysis);
}
