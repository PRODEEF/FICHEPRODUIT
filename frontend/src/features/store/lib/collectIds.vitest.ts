import { describe, expect, it } from 'vitest';

import type { ShopCategoryNode } from '@types-api';

import { collectIds } from './collectIds';

describe('collectIds', () => {
  it('retourne un tableau vide pour une liste vide', () => {
    expect(collectIds([])).toEqual([]);
  });

  it('collecte les ids d’une liste plate', () => {
    const nodes: ShopCategoryNode[] = [
      { id: 'a', name: 'A', children: [] },
      { id: 'b', name: 'B', children: [] },
    ];
    expect(collectIds(nodes)).toEqual(['a', 'b']);
  });

  it('collecte récursivement les ids des enfants', () => {
    const nodes: ShopCategoryNode[] = [
      {
        id: 'root',
        name: 'Root',
        children: [
          { id: 'child-1', name: 'Child 1', children: [] },
          {
            id: 'child-2',
            name: 'Child 2',
            children: [{ id: 'grand', name: 'Grand', children: [] }],
          },
        ],
      },
    ];
    expect(collectIds(nodes)).toEqual(['root', 'child-1', 'child-2', 'grand']);
  });
});
