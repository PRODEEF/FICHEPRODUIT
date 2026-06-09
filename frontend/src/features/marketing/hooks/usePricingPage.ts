import { useCallback, useMemo, useState } from 'react';

import type { ShopSectorLabel } from '@shared/lib/shopSectors';

import {
  DEFAULT_PRICING_SECTOR,
  getPlansForSector,
  getSectorMultiplier,
  type ComputedPlan,
} from '../lib/pricingConfig';
import {
  computeSavingsSimulation,
  SIMULATOR_MANUAL_MINUTES,
  SIMULATOR_SHEET_COUNT,
  type SavingsSimulationResult,
} from '../lib/pricingSimulator';

export function usePricingPage() {
  const [sector, setSector] = useState<ShopSectorLabel>(DEFAULT_PRICING_SECTOR);
  const [sheetCount, setSheetCount] = useState<number>(SIMULATOR_SHEET_COUNT.default);
  const [manualMinutes, setManualMinutes] = useState<number>(SIMULATOR_MANUAL_MINUTES.default);

  const plans = useMemo(() => getPlansForSector(sector), [sector]);
  const multiplier = useMemo(() => getSectorMultiplier(sector), [sector]);

  const simulationPricePerSheet = useMemo(() => {
    const proPlan = plans.find((plan) => plan.id === 'pro');
    return proPlan?.pricePerSheetEur ?? 10;
  }, [plans]);

  const savings: SavingsSimulationResult = useMemo(
    () =>
      computeSavingsSimulation({
        annualSheets: sheetCount,
        manualMinutesPerSheet: manualMinutes,
        pricePerSheetEur: simulationPricePerSheet,
      }),
    [manualMinutes, sheetCount, simulationPricePerSheet],
  );

  const selectSector = useCallback((next: ShopSectorLabel) => {
    setSector(next);
  }, []);

  return {
    sector,
    plans,
    multiplier,
    selectSector,
    sheetCount,
    setSheetCount,
    minSheetCount: SIMULATOR_SHEET_COUNT.min,
    maxSheetCount: SIMULATOR_SHEET_COUNT.max,
    manualMinutes,
    setManualMinutes,
    minManualMinutes: SIMULATOR_MANUAL_MINUTES.min,
    maxManualMinutes: SIMULATOR_MANUAL_MINUTES.max,
    manualMinutesStep: SIMULATOR_MANUAL_MINUTES.step,
    savings,
  };
}

export type { ComputedPlan };
