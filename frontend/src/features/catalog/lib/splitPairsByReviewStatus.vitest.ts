import { describe, expect, it } from 'vitest';

import type { CategoryExportPreviewPair } from '@types-api';

import { splitPairsByReviewStatus } from './splitPairsByReviewStatus';

function pair(
  overrides: Partial<CategoryExportPreviewPair> &
    Pick<CategoryExportPreviewPair, 'sourceKey' | 'matchKind' | 'manufacturerPath'>,
): CategoryExportPreviewPair {
  return {
    category: 'Cat',
    subCategory: null,
    suggestedPath: 'Path',
    suggestedNodeId: null,
    productCount: 1,
    ...overrides,
  };
}

describe('splitPairsByReviewStatus', () => {
  it('sépare exact vs token/none et trie none avant token', () => {
    const { toReview, ok } = splitPairsByReviewStatus([
      pair({ sourceKey: 'a', matchKind: 'exact', manufacturerPath: 'Zulu' }),
      pair({ sourceKey: 'b', matchKind: 'token', manufacturerPath: 'Bravo' }),
      pair({ sourceKey: 'c', matchKind: 'none', manufacturerPath: 'Alpha' }),
      pair({ sourceKey: 'd', matchKind: 'token', manufacturerPath: 'Alpha' }),
    ]);

    expect(ok.map((p) => p.sourceKey)).toEqual(['a']);
    expect(toReview.map((p) => p.sourceKey)).toEqual(['c', 'd', 'b']);
  });
});
