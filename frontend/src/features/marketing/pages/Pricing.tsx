import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';

import { FinalCTA } from '@shared/components/FinalCTA';
import { useAuth } from '@shared/hooks/useAuth';

import { startPlanCheckout } from '../../billing/lib/checkout';
import { PricingFaq } from '../components/PricingFaq';
import { PricingHero } from '../components/PricingHero';
import { PricingPlansGrid } from '../components/PricingPlansGrid';
import { SavingsSimulator } from '../components/SavingsSimulator';
import { UniverseSelector } from '../components/UniverseSelector';
import { usePricingPage } from '../hooks/usePricingPage';
import type { PricingPlanId } from '../lib/pricingConfig';

export function Pricing() {
  const navigate = useNavigate();
  const { userEmail } = useAuth();
  const [checkoutLoadingPlanId, setCheckoutLoadingPlanId] = useState<PricingPlanId | null>(null);

  const {
    sector,
    plans,
    selectSector,
    sheetCount,
    setSheetCount,
    minSheetCount,
    maxSheetCount,
    manualMinutes,
    setManualMinutes,
    minManualMinutes,
    maxManualMinutes,
    manualMinutesStep,
    savings,
  } = usePricingPage();

  const handleSelectPlan = useCallback(
    async (planId: PricingPlanId) => {
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

  return (
    <div className="relative z-[1] flex-1">
      <PricingHero />
      <UniverseSelector sector={sector} onSelectSector={selectSector} />
      <PricingPlansGrid
        plans={plans}
        sectorLabel={sector}
        isAuthenticated={Boolean(userEmail)}
        checkoutLoadingPlanId={checkoutLoadingPlanId}
        onSelectPlan={(planId) => void handleSelectPlan(planId)}
      />
      <SavingsSimulator
        sheetCount={sheetCount}
        minSheetCount={minSheetCount}
        maxSheetCount={maxSheetCount}
        onSheetCountChange={setSheetCount}
        manualMinutes={manualMinutes}
        minManualMinutes={minManualMinutes}
        maxManualMinutes={maxManualMinutes}
        manualMinutesStep={manualMinutesStep}
        onManualMinutesChange={setManualMinutes}
        savings={savings}
      />
      <PricingFaq />
      <FinalCTA />
    </div>
  );
}
