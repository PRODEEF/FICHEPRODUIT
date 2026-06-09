import { describe, expect, it } from 'vitest';

import {
  DEFAULT_PRICING_SECTOR,
  formatSectorMultiplier,
  getPlansForSector,
  getSectorMultiplier,
  isReferenceSector,
  PRICING_SECTOR_OPTIONS,
} from './pricingConfig';

describe('PRICING_SECTOR_OPTIONS', () => {
  it('expose les 16 univers boutique', () => {
    expect(PRICING_SECTOR_OPTIONS).toHaveLength(16);
    expect(PRICING_SECTOR_OPTIONS.map((o) => o.sector)).toContain('Glisse');
    expect(PRICING_SECTOR_OPTIONS.map((o) => o.sector)).toContain('Gaming');
  });
});

describe('formatSectorMultiplier', () => {
  it('formate en français avec une décimale', () => {
    expect(formatSectorMultiplier(2)).toBe('×2,0');
    expect(formatSectorMultiplier(1.3)).toBe('×1,3');
  });
});

describe('getSectorMultiplier', () => {
  it('retourne ×2 pour Vélo', () => {
    expect(getSectorMultiplier('Vélo')).toBe(2);
  });

  it('retourne ×1 pour Glisse (référence)', () => {
    expect(getSectorMultiplier('Glisse')).toBe(1);
    expect(isReferenceSector('Glisse')).toBe(true);
  });

  it('retourne ×1 pour un secteur sans multiplicateur explicite', () => {
    expect(getSectorMultiplier('Montagne')).toBe(1);
  });

  it('retourne ×0,6 pour Gastronomie', () => {
    expect(getSectorMultiplier('Gastronomie')).toBe(0.6);
  });
});

describe('getPlansForSector', () => {
  it('conserve les tarifs Glisse de référence', () => {
    const plans = getPlansForSector(DEFAULT_PRICING_SECTOR);
    const starter = plans.find((p) => p.id === 'starter');
    expect(starter?.priceEur).toBe(15);
    expect(starter?.pricePerSheetEur).toBe(14.9);
  });

  it('double le prix STARTER pour Vélo', () => {
    const plans = getPlansForSector('Vélo');
    const starter = plans.find((p) => p.id === 'starter');
    expect(starter?.priceEur).toBe(30);
    expect(starter?.pricePerSheetEur).toBe(29.8);
  });

  it('applique le multiplicateur au pack Platinium', () => {
    const plans = getPlansForSector('Mode');
    const platinum = plans.find((p) => p.id === 'platinum');
    expect(platinum?.priceEur).toBe(349.93);
  });
});
