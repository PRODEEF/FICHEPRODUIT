import type { CategoryExportMatchKind, CategoryExportPreviewPair } from '@types-api';

const MATCH_KIND_ORDER: Record<CategoryExportMatchKind, number> = {
  none: 0,
  token: 1,
  exact: 2,
};

function sortPairs(a: CategoryExportPreviewPair, b: CategoryExportPreviewPair): number {
  const byKind = MATCH_KIND_ORDER[a.matchKind] - MATCH_KIND_ORDER[b.matchKind];
  if (byKind !== 0) return byKind;
  return a.manufacturerPath.localeCompare(b.manufacturerPath, 'fr');
}

/** Sépare les paires en « À vérifier » (none/token) et « OK » (exact). */
export function splitPairsByReviewStatus(pairs: CategoryExportPreviewPair[]): {
  toReview: CategoryExportPreviewPair[];
  ok: CategoryExportPreviewPair[];
} {
  const toReview: CategoryExportPreviewPair[] = [];
  const ok: CategoryExportPreviewPair[] = [];
  for (const pair of pairs) {
    if (pair.matchKind === 'exact') {
      ok.push(pair);
    } else {
      toReview.push(pair);
    }
  }
  toReview.sort(sortPairs);
  ok.sort(sortPairs);
  return { toReview, ok };
}
