import assert from 'node:assert/strict';
import test from 'node:test';

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
    sessionId: null,
    shopId: null,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

void test('resolveCatalogWorkflowStatus retourne failed sur erreur explicite', () => {
  const status = resolveCatalogWorkflowStatus({
    analysis: analysis({ status: 'done', shopId: 'shop-1' }),
    loadingProducts: false,
    hasProducts: false,
    error: 'boom',
  });

  assert.equal(status, 'failed');
});

void test('resolveCatalogWorkflowStatus retourne ready quand produits chargés', () => {
  const status = resolveCatalogWorkflowStatus({
    analysis: analysis({ status: 'done', shopId: 'shop-1' }),
    loadingProducts: false,
    hasProducts: true,
    error: null,
  });

  assert.equal(status, 'ready');
});

void test('resolveCatalogWorkflowStatus retourne loading_products pendant chargement', () => {
  const status = resolveCatalogWorkflowStatus({
    analysis: analysis({ status: 'done', shopId: 'shop-1' }),
    loadingProducts: true,
    hasProducts: false,
    error: null,
  });

  assert.equal(status, 'loading_products');
});
