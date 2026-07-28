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
      categoryTree: [],
      ownerId: '22222222-2222-2222-2222-222222222222',
      createdAt: '2020-01-01T00:00:00.000Z',
      updatedAt: '2020-01-01T00:00:00.000Z',
    });

    expect(out).not.toBeNull();
    expect(out?.url).toBe('');
    expect(out?.name).toBe('Mon magasin');
    expect(out?.categoryTree).toEqual([]);
  });

  it('normalise categoryTree imbriqué', () => {
    const out = normalizeShop({
      id: '11111111-1111-4111-8111-111111111111',
      name: 'Shop',
      url: 'https://example.com',
      cms: 'prestashop',
      sector: null,
      brands: [],
      categoryTree: [
        {
          id: '22222222-2222-4222-8222-222222222222',
          name: 'Glisse',
          children: [
            {
              id: '33333333-3333-4333-8333-333333333333',
              name: 'Kitesurf',
              children: [],
            },
          ],
        },
      ],
      ownerId: '22222222-2222-4222-8222-222222222222',
      createdAt: '2020-01-01T00:00:00.000Z',
      updatedAt: '2020-01-01T00:00:00.000Z',
    });

    expect(out?.categoryTree).toHaveLength(1);
    expect(out?.categoryTree[0]?.name).toBe('Glisse');
    expect(out?.categoryTree[0]?.children[0]?.name).toBe('Kitesurf');
  });
});
