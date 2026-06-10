import { describe, expect, it } from 'vitest';

import { mergePlansFromApi } from './mergePlansFromApi';

describe('mergePlansFromApi', () => {
  it('fusionne un forfait API avec les métadonnées UI', () => {
    const plans = mergePlansFromApi(
      [
        {
          id: 'pro',
          name: 'PRO',
          priceEur: 200,
          pricePerSheetEur: 10,
          priceSuffix: null,
          creditsLabel: '10 crédits',
          multiplier: 1,
        },
      ],
      'Glisse',
    );

    expect(plans).toHaveLength(1);
    expect(plans[0]?.creditsLabel).toBe('10 crédits');
    expect(plans[0]?.ctaLabel).toBe('Commencer');
    expect(plans[0]?.ctaMailto).toBeNull();
  });

  it('ignore les forfaits sans entrée UI', () => {
    const plans = mergePlansFromApi(
      [
        {
          id: 'starter',
          name: 'STARTER',
          priceEur: 15,
          pricePerSheetEur: 15,
          priceSuffix: null,
          creditsLabel: '1 crédit',
          multiplier: 1,
        },
      ],
      'Glisse',
    );

    expect(plans).toHaveLength(1);
  });

  it('ajoute un mailto pour business_custom', () => {
    const plans = mergePlansFromApi(
      [
        {
          id: 'business_custom',
          name: 'BUSINESS CUSTOM',
          priceEur: 2500,
          pricePerSheetEur: null,
          priceSuffix: null,
          creditsLabel: 'Crédits à la demande',
          multiplier: 1,
        },
      ],
      'Vélo',
    );

    expect(plans[0]?.ctaMailto).toContain('mailto:');
    expect(plans[0]?.ctaMailto).toContain('V%C3%A9lo');
  });
});
