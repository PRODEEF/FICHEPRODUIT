import { useMemo, useState } from 'react';

import {
  computeSavingsSimulation,
  SIMULATOR_MANUAL_MINUTES,
  SIMULATOR_SHEET_COUNT,
  type SavingsSimulationResult,
} from '../lib/pricingSimulator';

export interface UseSavingsSimulatorOptions {
  pricePerSheetEur: number | null;
  ready: boolean;
}

const EMPTY_SAVINGS: SavingsSimulationResult = {
  manualCostEur: 0,
  ficheproductCostEur: 0,
  annualSavingsEur: 0,
};

export function useSavingsSimulator({ pricePerSheetEur, ready }: UseSavingsSimulatorOptions) {
  const [sheetCount, setSheetCount] = useState<number>(SIMULATOR_SHEET_COUNT.default);
  const [manualMinutes, setManualMinutes] = useState<number>(SIMULATOR_MANUAL_MINUTES.default);

  const savings = useMemo(() => {
    if (!ready || pricePerSheetEur === null) {
      return EMPTY_SAVINGS;
    }

    return computeSavingsSimulation({
      annualSheets: sheetCount,
      manualMinutesPerSheet: manualMinutes,
      pricePerSheetEur,
    });
  }, [manualMinutes, pricePerSheetEur, ready, sheetCount]);

  return {
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
