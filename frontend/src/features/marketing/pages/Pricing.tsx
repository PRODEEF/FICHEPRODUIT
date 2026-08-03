import { isShopSectorLabel } from '@shared/lib/shopSectors';
import { FinalCTA } from '@shared/components/FinalCTA';
import { useAuth } from '@shared/hooks/useAuth';

import { useShop } from '../../store/hooks/useShop';
import { PricingFaq } from '../components/PricingFaq';
import { PricingHero } from '../components/PricingHero';
import { PricingPlansGrid } from '../components/PricingPlansGrid';
import { SavingsSimulator } from '../components/SavingsSimulator';
import { SectorSelector } from '../components/SectorSelector';
import { usePlanCheckout } from '../hooks/usePlanCheckout';
import { usePricingPage } from '../hooks/usePricingPage';

export function Pricing() {
  const { userEmail } = useAuth();
  const { shop, loading: shopLoading } = useShop();
  const shopSector = shop?.sector && isShopSectorLabel(shop.sector) ? shop.sector : undefined;

  const isAuthenticated = Boolean(userEmail);

  const {
    sector,
    plans,
    plansLoading,
    plansError,
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
    simulatorReady,
  } = usePricingPage({
    initialSector: shopSector ?? null,
    lockSector: isAuthenticated,
    deferPlansFetch: isAuthenticated && shopLoading,
  });

  const { checkoutLoadingPlanId, handleSelectPlan } = usePlanCheckout(sector);

  return (
    <div className="relative z-[1] flex-1">
      <PricingHero variant={isAuthenticated ? 'authenticated' : 'visitor'} />
      <SectorSelector
        sector={sector}
        onSelectSector={selectSector}
        readOnly={isAuthenticated}
        loading={isAuthenticated && shopLoading}
      />
      <SavingsSimulator
        ready={simulatorReady}
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
      <PricingPlansGrid
        plans={plans}
        sectorLabel={sector}
        isAuthenticated={isAuthenticated}
        plansLoading={plansLoading}
        plansError={plansError}
        checkoutLoadingPlanId={checkoutLoadingPlanId}
        onSelectPlan={(planId) => void handleSelectPlan(planId)}
      />
      <PricingFaq />
      {!isAuthenticated ? <FinalCTA /> : null}
    </div>
  );
}
