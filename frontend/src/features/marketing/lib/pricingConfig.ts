import { SHOP_SECTOR_LABELS, type ShopSectorLabel } from '@shared/lib/shopSectors';

import { roundPrice } from './pricingFormat';

export type PricingPlanId =
  | 'starter'
  | 'pro'
  | 'business_silver'
  | 'business_gold'
  | 'platinum';

export interface PricingFeature {
  label: string;
  included: boolean;
}

export interface ReferencePlan {
  id: PricingPlanId;
  name: string;
  priceEur: number;
  pricePerSheetEur: number | null;
  priceSuffix: string | null;
  creditsLabel: string;
  features: PricingFeature[];
  recommended: boolean;
  ctaLabel: string;
  ctaPrimary: boolean;
}

export interface ComputedPlan extends ReferencePlan {
  multiplier: number;
}

/** Forfaits de référence — secteur Glisse (×1,0). */
export const REFERENCE_PLANS: ReferencePlan[] = [
  {
    id: 'starter',
    name: 'STARTER',
    priceEur: 15,
    pricePerSheetEur: 14.9,
    priceSuffix: null,
    creditsLabel: '1 crédit',
    features: [
      { label: 'Import PrestaShop & Shopify', included: true },
      { label: 'Analyse style rédactionnel', included: true },
      { label: 'Fiches < 200 € offertes', included: false },
    ],
    recommended: false,
    ctaLabel: 'Commencer',
    ctaPrimary: false,
  },
  {
    id: 'pro',
    name: 'PRO',
    priceEur: 200,
    pricePerSheetEur: 10,
    priceSuffix: null,
    creditsLabel: '20 crédits',
    features: [
      { label: 'Import PrestaShop & Shopify', included: true },
      { label: 'Analyse style rédactionnel', included: true },
      { label: 'Fiches < 200 € offertes', included: false },
    ],
    recommended: false,
    ctaLabel: 'Commencer',
    ctaPrimary: false,
  },
  {
    id: 'business_silver',
    name: 'BUSINESS SILVER',
    priceEur: 800,
    pricePerSheetEur: 8,
    priceSuffix: null,
    creditsLabel: '100 crédits',
    features: [
      { label: 'Import PrestaShop & Shopify', included: true },
      { label: 'Analyse style rédactionnel', included: true },
      { label: 'Fiches < 200 € offertes', included: true },
    ],
    recommended: true,
    ctaLabel: 'Choisir ce pack',
    ctaPrimary: true,
  },
  {
    id: 'business_gold',
    name: 'BUSINESS GOLD',
    priceEur: 2500,
    pricePerSheetEur: 5,
    priceSuffix: null,
    creditsLabel: '500 crédits',
    features: [
      { label: 'Import PrestaShop & Shopify', included: true },
      { label: 'Analyse style rédactionnel', included: true },
      { label: 'Fiches < 200 € offertes', included: true },
    ],
    recommended: false,
    ctaLabel: 'Commencer',
    ctaPrimary: false,
  },
  {
    id: 'platinum',
    name: 'PLATINIUM',
    priceEur: 499.9,
    pricePerSheetEur: null,
    priceSuffix: 'par mois',
    creditsLabel: 'Crédits illimités*',
    features: [
      { label: 'Import PrestaShop & Shopify', included: true },
      { label: 'Analyse style rédactionnel', included: true },
      { label: 'Fiches < 200 € offertes', included: true },
    ],
    recommended: false,
    ctaLabel: 'Souscrire',
    ctaPrimary: false,
  },
];

const DEFAULT_SECTOR_MULTIPLIER = 1;

/**
 * Multiplicateurs tarifaires par secteur (référence Glisse = ×1,0).
 * Secteurs non listés explicitement : ×1,0.
 */
export const SECTOR_PRICE_MULTIPLIERS: Record<ShopSectorLabel, number> = {
  Vélo: 2,
  Nautisme: 1.3,
  Gaming: 1.3,
  Outdoor: 1.2,
  Glisse: 1,
  Sport: 0.9,
  Maison: 0.8,
  Mode: 0.7,
  Gastronomie: 0.6,
  Montagne: DEFAULT_SECTOR_MULTIPLIER,
  Animalerie: DEFAULT_SECTOR_MULTIPLIER,
  Jardin: DEFAULT_SECTOR_MULTIPLIER,
  Bricolage: DEFAULT_SECTOR_MULTIPLIER,
  Puériculture: DEFAULT_SECTOR_MULTIPLIER,
  Bijoux: DEFAULT_SECTOR_MULTIPLIER,
  Montres: DEFAULT_SECTOR_MULTIPLIER,
};

export function getSectorMultiplier(sector: ShopSectorLabel): number {
  return SECTOR_PRICE_MULTIPLIERS[sector];
}

export function isReferenceSector(sector: ShopSectorLabel): boolean {
  return getSectorMultiplier(sector) === 1;
}

function applyMultiplierToPlan(plan: ReferencePlan, multiplier: number): ComputedPlan {
  return {
    ...plan,
    multiplier,
    priceEur: roundPrice(plan.priceEur * multiplier),
    pricePerSheetEur:
      plan.pricePerSheetEur !== null ? roundPrice(plan.pricePerSheetEur * multiplier) : null,
  };
}

export function getPlansForSector(sector: ShopSectorLabel): ComputedPlan[] {
  const multiplier = getSectorMultiplier(sector);
  return REFERENCE_PLANS.map((plan) => applyMultiplierToPlan(plan, multiplier));
}

export const DEFAULT_PRICING_SECTOR: ShopSectorLabel = 'Glisse';

export interface PricingSectorOption {
  sector: ShopSectorLabel;
  displayLabel: string;
  multiplier: number;
}

/** Les 16 univers boutique exposés dans le sélecteur tarifs. */
export const PRICING_SECTOR_OPTIONS: PricingSectorOption[] = SHOP_SECTOR_LABELS.map((sector) => ({
  sector,
  displayLabel: sector,
  multiplier: SECTOR_PRICE_MULTIPLIERS[sector],
}));

export function formatSectorMultiplier(value: number): string {
  return `×${value.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}`;
}

export function isShopSectorLabel(value: string): value is ShopSectorLabel {
  return (SHOP_SECTOR_LABELS as readonly string[]).includes(value);
}
