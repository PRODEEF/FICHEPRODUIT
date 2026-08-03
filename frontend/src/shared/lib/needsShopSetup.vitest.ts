import { describe, expect, it } from 'vitest';

import type { Shop } from '@types-api';

import { needsShopSetup } from './needsShopSetup';

function makeShop(overrides: Partial<Shop> = {}): Shop {
  return {
    id: 'shop-1',
    name: 'Ma boutique',
    url: '',
    cms: 'inconnu',
    sector: 'Autres',
    brands: [],
    categoryTree: [],
    ownerId: 'user-1',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('needsShopSetup', () => {
  it('retourne true si l’URL est vide', () => {
    expect(needsShopSetup(makeShop())).toBe(true);
  });

  it('retourne true si l’URL est renseignée mais sans enrichissement analyse', () => {
    expect(needsShopSetup(makeShop({ url: 'https://example.com' }))).toBe(true);
  });

  it('retourne false si des marques ont été détectées', () => {
    expect(needsShopSetup(makeShop({ url: 'https://example.com', brands: ['Nike'] }))).toBe(false);
  });

  it('retourne false si un CMS a été détecté même sans marques', () => {
    expect(
      needsShopSetup(makeShop({ url: 'https://example.com', cms: 'prestashop', brands: [] })),
    ).toBe(false);
  });

  it('retourne false si des catégories sont présentes', () => {
    expect(
      needsShopSetup(
        makeShop({
          url: 'https://example.com',
          categoryTree: [{ id: '1', name: 'Sport', children: [] }],
        }),
      ),
    ).toBe(false);
  });

  it('retourne true si seul un secteur est renseigné sans marques ni CMS', () => {
    expect(needsShopSetup(makeShop({ url: 'https://example.com', sector: 'Mode' }))).toBe(true);
  });
});
