import { describe, expect, it } from 'vitest';

import { computeSavingsSimulation } from './pricingSimulator';

describe('computeSavingsSimulation', () => {
  it('calcule coût manuel, Fiche Produit et économies (250 fiches, 30 min, 10 €/fiche)', () => {
    // Manuel : 250 × 30 min / 60 × 20 €/h = 2500 €
    const result = computeSavingsSimulation({
      annualSheets: 250,
      manualMinutesPerSheet: 30,
      pricePerSheetEur: 10,
    });

    expect(result.manualCostEur).toBe(2500);
    expect(result.ficheproductCostEur).toBe(2500);
    expect(result.annualSavingsEur).toBe(0);
  });
});
