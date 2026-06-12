import { describe, expect, it } from 'vitest';

import type { BillingSummary, CatalogProduct } from '@types-api';

import {
  countFreeExportProducts,
  estimateExportCredits,
  EXPORT_FREE_PRICE_THRESHOLD_EUR,
  getFreeLowPriceExportsExpiresAt,
  hasActiveFreeLowPriceExports,
} from './estimateExportCredits';

function product(overrides: Partial<CatalogProduct>): CatalogProduct {
  return {
    id: 'p1',
    name: 'Produit',
    brand: 'Brand',
    sector: 'Glisse',
    category: 'Category',
    subCategory: 'Sub',
    year: 2024,
    price: 100,
    description: 'desc',
    detailedDescription: '',
    images: [],
    url: 'https://example.com/p1',
    attributes: {},
    ...overrides,
  };
}

function billingSummary(overrides: Partial<BillingSummary> = {}): BillingSummary {
  return {
    balance: 5,
    hasUnlimitedExports: false,
    subscription: null,
    entitlements: [],
    recentPurchases: [],
    recentTransactions: [],
    ...overrides,
  };
}

describe('estimateExportCredits', () => {
  it('compte un crédit par produit sélectionné', () => {
    const result = estimateExportCredits(
      [product({ id: 'a' }), product({ id: 'b' })],
      2,
      billingSummary({ balance: 1 }),
    );
    expect(result.requiredCredits).toBe(2);
    expect(result.hasEnoughCredits).toBe(false);
  });

  it('autorise l’export si le solde couvre la sélection', () => {
    const result = estimateExportCredits([product({ id: 'a' })], 1, billingSummary({ balance: 3 }));
    expect(result.hasEnoughCredits).toBe(true);
  });

  it('ne consomme aucun crédit avec exports illimités', () => {
    const result = estimateExportCredits(
      [product({ id: 'a' }), product({ id: 'b' })],
      2,
      billingSummary({ hasUnlimitedExports: true, balance: 0 }),
    );
    expect(result.requiredCredits).toBe(0);
    expect(result.hasEnoughCredits).toBe(true);
  });

  it('utilise le décompte de sélection si les produits ne sont pas encore résolus', () => {
    const result = estimateExportCredits([], 216, billingSummary({ balance: 123 }));
    expect(result.requiredCredits).toBe(216);
    expect(result.hasEnoughCredits).toBe(false);
  });

  it('exclut les produits sous le seuil avec entitlement low-price', () => {
    const cheap = product({ id: 'cheap', price: EXPORT_FREE_PRICE_THRESHOLD_EUR - 1 });
    const expensive = product({ id: 'expensive', price: EXPORT_FREE_PRICE_THRESHOLD_EUR });
    const result = estimateExportCredits(
      [cheap, expensive],
      2,
      billingSummary({
        balance: 1,
        entitlements: [
          {
            type: 'free_low_price_exports',
            expiresAt: '2030-01-01T00:00:00.000Z',
          },
        ],
      }),
    );
    expect(result.requiredCredits).toBe(1);
    expect(result.hasEnoughCredits).toBe(true);
  });
});

describe('hasActiveFreeLowPriceExports', () => {
  it('retourne false sans entitlement actif', () => {
    expect(hasActiveFreeLowPriceExports(null)).toBe(false);
    expect(hasActiveFreeLowPriceExports(billingSummary())).toBe(false);
    expect(
      hasActiveFreeLowPriceExports(
        billingSummary({
          entitlements: [
            { type: 'free_low_price_exports', expiresAt: '2020-01-01T00:00:00.000Z' },
          ],
        }),
      ),
    ).toBe(false);
  });

  it('retourne true avec entitlement non expiré', () => {
    expect(
      hasActiveFreeLowPriceExports(
        billingSummary({
          entitlements: [
            { type: 'free_low_price_exports', expiresAt: '2030-01-01T00:00:00.000Z' },
          ],
        }),
      ),
    ).toBe(true);
  });
});

describe('getFreeLowPriceExportsExpiresAt', () => {
  it('retourne la date d’expiration active', () => {
    expect(
      getFreeLowPriceExportsExpiresAt(
        billingSummary({
          entitlements: [
            { type: 'free_low_price_exports', expiresAt: '2030-06-15T00:00:00.000Z' },
          ],
        }),
      ),
    ).toBe('2030-06-15T00:00:00.000Z');
  });
});

describe('countFreeExportProducts', () => {
  it('compte les fiches sous le seuil avec forfait actif', () => {
    const cheap = product({ id: 'cheap', price: EXPORT_FREE_PRICE_THRESHOLD_EUR - 1 });
    const expensive = product({ id: 'expensive', price: EXPORT_FREE_PRICE_THRESHOLD_EUR });
    expect(countFreeExportProducts([cheap, expensive], true)).toBe(1);
    expect(countFreeExportProducts([cheap, expensive], false)).toBe(0);
  });
});
