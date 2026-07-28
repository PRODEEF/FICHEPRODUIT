import { describe, expect, it } from 'vitest';

import type { Analysis } from '@types-api';

import { resolveCatalogWorkflowStatus } from './catalogWorkflowStatus';

function analysis(overrides: Partial<Analysis>): Analysis {
  return {
    id: 'a1',
    url: 'https://example.com',
    status: 'pending',
    errorCode: null,
    errorMessage: null,
    userId: 'u1',
    shopId: null,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('resolveCatalogWorkflowStatus', () => {
  it('retourne failed sur erreur explicite', () => {
    const status = resolveCatalogWorkflowStatus({
      analysis: analysis({ status: 'done', shopId: 'shop-1' }),
      loadingProducts: false,
      hasProducts: false,
      error: 'boom',
    });

    expect(status).toBe('failed');
  });

  it('retourne ready quand produits chargés', () => {
    const status = resolveCatalogWorkflowStatus({
      analysis: analysis({ status: 'done', shopId: 'shop-1' }),
      loadingProducts: false,
      hasProducts: true,
      error: null,
    });

    expect(status).toBe('ready');
  });

  it('retourne loading_products pendant chargement', () => {
    const status = resolveCatalogWorkflowStatus({
      analysis: analysis({ status: 'done', shopId: 'shop-1' }),
      loadingProducts: true,
      hasProducts: false,
      error: null,
    });

    expect(status).toBe('loading_products');
  });
});
