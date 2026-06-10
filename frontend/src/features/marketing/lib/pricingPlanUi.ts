import type { BillingPlanId } from '@api/types/api.types';

export interface PricingFeature {
  label: string;
  included: boolean;
}

export interface PricingPlanUiConfig {
  features: PricingFeature[];
  recommended: boolean;
  ctaLabel: string;
  ctaPrimary: boolean;
}

/** Métadonnées d'affichage UI — les prix viennent de l'API `/billing/plans`. */
export const PRICING_PLAN_UI: Record<BillingPlanId, PricingPlanUiConfig> = {
  starter: {
    features: [
      { label: 'Import PrestaShop & Shopify', included: true },
      { label: 'Analyse style rédactionnel', included: true },
      { label: 'Fiches < 200 € offertes', included: false },
    ],
    recommended: false,
    ctaLabel: 'Commencer',
    ctaPrimary: false,
  },
  pro: {
    features: [
      { label: 'Import PrestaShop & Shopify', included: true },
      { label: 'Analyse style rédactionnel', included: true },
      { label: 'Fiches < 200 € offertes', included: false },
    ],
    recommended: false,
    ctaLabel: 'Commencer',
    ctaPrimary: false,
  },
  business_silver: {
    features: [
      { label: 'Import PrestaShop & Shopify', included: true },
      { label: 'Analyse style rédactionnel', included: true },
      { label: 'Fiches < 200 € offertes', included: true },
    ],
    recommended: true,
    ctaLabel: 'Choisir ce pack',
    ctaPrimary: true,
  },
  business_custom: {
    features: [
      { label: 'Import PrestaShop & Shopify', included: true },
      { label: 'Analyse style rédactionnel', included: true },
      { label: 'Fiches < 200 € offertes', included: true },
    ],
    recommended: false,
    ctaLabel: 'Nous contacter',
    ctaPrimary: false,
  },
  platinum: {
    features: [
      { label: 'Import PrestaShop & Shopify', included: true },
      { label: 'Analyse style rédactionnel', included: true },
      { label: 'Fiches < 200 € offertes', included: true },
    ],
    recommended: false,
    ctaLabel: 'Souscrire',
    ctaPrimary: false,
  },
};
