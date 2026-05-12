import { describe, expect, it } from 'vitest';

import { normalizeShop } from './shop';

describe('normalizeShop', () => {
  it('accepte une url vide pour un magasin minimal', () => {
    const out = normalizeShop({
      id: '11111111-1111-1111-1111-111111111111',
      name: 'Mon magasin',
      url: '',
      cms: 'inconnu',
      sector: null,
      brands: [],
      categories: [],
      ownerId: '22222222-2222-2222-2222-222222222222',
      createdAt: '2020-01-01T00:00:00.000Z',
      updatedAt: '2020-01-01T00:00:00.000Z',
    });

    expect(out).not.toBeNull();
    expect(out?.url).toBe('');
    expect(out?.name).toBe('Mon magasin');
  });
});
