import type { ShopSectorLabel } from '@shared/lib/shopSectors';

import type { ComputedPlan, PricingPlanId } from '../lib/pricingConfig';

import { PricingPlanCard } from './PricingPlanCard';

interface PricingPlansGridProps {
  plans: ComputedPlan[];
  sectorLabel: ShopSectorLabel;
  isAuthenticated: boolean;
  checkoutLoadingPlanId: PricingPlanId | null;
  onSelectPlan: (planId: PricingPlanId) => void;
}

export function PricingPlansGrid({
  plans,
  sectorLabel,
  isAuthenticated,
  checkoutLoadingPlanId,
  onSelectPlan,
}: PricingPlansGridProps) {
  return (
    <section
      className="mb-16 w-full px-2 sm:px-3 md:px-4"
      aria-label={`Forfaits ${sectorLabel}`}
    >
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
    </section>
  );
}
