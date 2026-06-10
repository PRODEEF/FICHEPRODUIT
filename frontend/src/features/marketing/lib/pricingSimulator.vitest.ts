import { describe, expect, it } from 'vitest';

import { computeSavingsSimulation } from './pricingSimulator';

describe('computeSavingsSimulation', () => {
  it('reproduit les valeurs de la maquette (250 fiches, 30 min, 10 €/fiche)', () => {
    const result = computeSavingsSimulation({
      annualSheets: 250,
      manualMinutesPerSheet: 30,
      pricePerSheetEur: 10,
    });

    expect(result.manualCostEur).toBe(3125);
    expect(result.ficheproductCostEur).toBe(2500);
    expect(result.annualSavingsEur).toBe(625);
  });
});
