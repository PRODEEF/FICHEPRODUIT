import type { Analysis } from '@types-api';

function timestampMs(analysis: Analysis): number {
  const created = Date.parse(analysis.createdAt);
  if (!Number.isNaN(created)) return created;
  return 0;
}

/** Trie par `updatedAt` puis `createdAt` (plus récent en premier). */
export function pickLatestSiteAnalysisId(analyses: Analysis[]): string | null {
  if (analyses.length === 0) return null;
  const first = analyses[0];
  if (first === undefined) return null;
  let best = first;
  let bestTimestamp = timestampMs(best);
  for (let i = 1; i < analyses.length; i++) {
    const analysis = analyses[i];
    if (analysis === undefined) continue;
    const analysisTimestamp = timestampMs(analysis);
    if (analysisTimestamp > bestTimestamp) {
      best = analysis;
      bestTimestamp = analysisTimestamp;
    }
  }
  return best.id;
}
