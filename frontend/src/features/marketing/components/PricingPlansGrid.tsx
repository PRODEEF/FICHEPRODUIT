import type { ShopSectorLabel } from '@shared/lib/shopSectors';

import type { BillingPlanId } from '@api/types/api.types';

import type { ComputedPlan } from '../types';
import { PRICING_EXCL_TAX_NOTICE } from '../lib/pricingConstants';

import { PricingPlanCard } from './PricingPlanCard';

interface PricingPlansGridProps {
  plans: ComputedPlan[];
  sectorLabel: ShopSectorLabel;
  isAuthenticated: boolean;
  plansLoading?: boolean;
  plansError?: string | null;
  checkoutLoadingPlanId: BillingPlanId | null;
  onSelectPlan: (planId: BillingPlanId) => void;
}

export function PricingPlansGrid({
  plans,
  sectorLabel,
  isAuthenticated,
  plansLoading = false,
  plansError = null,
  checkoutLoadingPlanId,
  onSelectPlan,
}: PricingPlansGridProps) {
  const showEmptyState = !plansLoading && plans.length === 0;

  return (
    <section
      className="mb-16 w-full px-2 sm:px-3 md:px-4"
      aria-label={`Forfaits ${sectorLabel}`}
      aria-busy={plansLoading}
    >
      {plansLoading ? (
        <p className="mb-4 text-center text-sm text-text-muted" role="status">
          Mise à jour des tarifs…
        </p>
      ) : null}
      {showEmptyState ? (
        <p className="mb-4 text-center text-sm text-text-muted" role="status">
          {plansError ?? 'Aucun forfait disponible pour ce secteur.'}
        </p>
      ) : null}
      {plans.length > 0 ? (
        <>
          <div className="mx-auto grid max-w-[1440px] grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-5 lg:gap-3">
            {plans.map((plan) => (
              <PricingPlanCard
                key={plan.id}
                plan={plan}
                isAuthenticated={isAuthenticated}
                checkoutLoading={checkoutLoadingPlanId === plan.id}
                onSelectPlan={onSelectPlan}
              />
            ))}
          </div>
          <p className="mx-auto mt-4 max-w-[1440px] text-center text-xs text-text-muted">
            {PRICING_EXCL_TAX_NOTICE}
          </p>
        </>
      ) : null}
    </section>
  );
}
