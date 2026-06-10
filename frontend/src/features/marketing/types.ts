import type { BillingPlanId } from '@api/types/api.types';

import type { PricingPlanUiConfig } from './lib/pricingPlanUi';

export interface ComputedPlan {
  id: BillingPlanId;
  name: string;
  priceEur: number;
  pricePerSheetEur: number | null;
  priceSuffix: string | null;
  creditsLabel: string;
  features: PricingPlanUiConfig['features'];
  recommended: boolean;
  ctaLabel: string;
  ctaPrimary: boolean;
  /** Lien mailto — remplace le checkout Stripe pour ce forfait. */
  ctaMailto: string | null;
}
