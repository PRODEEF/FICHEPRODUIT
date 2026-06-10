import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';

import type { BillingPlanId } from '@api/types/api.types';
import { useAuth } from '@shared/hooks/useAuth';
import type { ShopSectorLabel } from '@shared/lib/shopSectors';

import { startPlanCheckout } from '../../billing/lib/checkout';

export function usePlanCheckout(sector: ShopSectorLabel) {
  const navigate = useNavigate();
  const { userEmail } = useAuth();
  const [checkoutLoadingPlanId, setCheckoutLoadingPlanId] = useState<BillingPlanId | null>(null);

  const handleSelectPlan = useCallback(
    async (planId: BillingPlanId) => {
      if (!userEmail) {
        void navigate('/signup');
        return;
      }

      setCheckoutLoadingPlanId(planId);
      const result = await startPlanCheckout(planId, sector);
      setCheckoutLoadingPlanId(null);

      if (!result.ok) {
        if (result.needsAuth) {
          void navigate('/login');
          return;
        }
        toast.error('Paiement indisponible', { description: result.message });
      }
    },
    [navigate, sector, userEmail],
  );

  return {
    checkoutLoadingPlanId,
    handleSelectPlan,
    isAuthenticated: Boolean(userEmail),
  };
}
