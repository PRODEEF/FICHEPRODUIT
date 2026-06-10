import { useEffect, useState } from 'react';

import { fetchBillingPlans } from '@api/billing';
import type { ShopSectorLabel } from '@shared/lib/shopSectors';

import { mergePlansFromApi } from '../lib/mergePlansFromApi';
import type { ComputedPlan } from '../types';

export interface UseBillingPlansOptions {
  /** Retarde le chargement (ex. en attente du secteur boutique). */
  defer?: boolean;
}

export function useBillingPlans(sector: ShopSectorLabel, options: UseBillingPlansOptions = {}) {
  const { defer = false } = options;

  const [plans, setPlans] = useState<ComputedPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [plansError, setPlansError] = useState<string | null>(null);

  useEffect(() => {
    if (defer) {
      setPlansLoading(true);
      setPlansError(null);
      return;
    }

    let cancelled = false;
    setPlansLoading(true);
    setPlansError(null);

    void fetchBillingPlans(sector)
      .then((response) => {
        if (cancelled) return;
        setPlans(mergePlansFromApi(response.plans, sector));
      })
      .catch(() => {
        if (cancelled) return;
        setPlans([]);
        setPlansError(
          'Impossible de charger les tarifs. Vérifiez votre connexion et réessayez.',
        );
      })
      .finally(() => {
        if (!cancelled) setPlansLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [defer, sector]);

  const proPricePerSheet = plans.find((plan) => plan.id === 'pro')?.pricePerSheetEur ?? null;

  return {
    plans,
    plansLoading,
    plansError,
    proPricePerSheet,
    simulatorReady: !plansLoading && !plansError && proPricePerSheet !== null,
  };
}
