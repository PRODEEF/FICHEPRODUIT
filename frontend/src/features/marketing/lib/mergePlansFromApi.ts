import type { PublicPricingPlan } from '@api/types/api.types';
import type { ShopSectorLabel } from '@shared/lib/shopSectors';

import type { ComputedPlan } from '../types';
import { buildBusinessCustomContactMailto } from './pricingConstants';
import { PRICING_PLAN_UI } from './pricingPlanUi';

/** Fusionne les forfaits API avec les métadonnées UI marketing. */
export function mergePlansFromApi(
  apiPlans: PublicPricingPlan[],
  sector: ShopSectorLabel,
): ComputedPlan[] {
  return apiPlans.map((plan) => {
    const ui = PRICING_PLAN_UI[plan.id];
    return {
      id: plan.id,
      name: plan.name,
      priceEur: plan.priceEur,
      pricePerSheetEur: plan.pricePerSheetEur,
      priceSuffix: plan.priceSuffix,
      creditsLabel: plan.creditsLabel,
      features: ui.features,
      recommended: ui.recommended,
      ctaLabel: ui.ctaLabel,
      ctaPrimary: ui.ctaPrimary,
      ctaMailto: plan.id === 'business_custom' ? buildBusinessCustomContactMailto(sector) : null,
    };
  });
}
