import { roundPrice } from './pricingFormat';

/** Taux horaire rédaction manuelle (€/h) — base du simulateur. */
export const MANUAL_WRITING_HOURLY_RATE_EUR = 25;

export const SIMULATOR_SHEET_COUNT = {
  min: 10,
  max: 500,
  default: 250,
} as const;

export const SIMULATOR_MANUAL_MINUTES = {
  min: 15,
  max: 120,
  step: 5,
  default: 30,
} as const;

export interface SavingsSimulationInput {
  annualSheets: number;
  manualMinutesPerSheet: number;
  pricePerSheetEur: number;
}

export interface SavingsSimulationResult {
  manualCostEur: number;
  ficheproductCostEur: number;
  annualSavingsEur: number;
}

export function computeManualWritingCost(
  annualSheets: number,
  manualMinutesPerSheet: number,
): number {
  const hours = (annualSheets * manualMinutesPerSheet) / 60;
  return roundPrice(hours * MANUAL_WRITING_HOURLY_RATE_EUR);
}

export function computeFicheproductCost(annualSheets: number, pricePerSheetEur: number): number {
  return roundPrice(annualSheets * pricePerSheetEur);
}

export function computeAnnualSavings(manualCostEur: number, ficheproductCostEur: number): number {
  return roundPrice(Math.max(0, manualCostEur - ficheproductCostEur));
}

export function computeSavingsSimulation(
  input: SavingsSimulationInput,
): SavingsSimulationResult {
  const manualCostEur = computeManualWritingCost(input.annualSheets, input.manualMinutesPerSheet);
  const ficheproductCostEur = computeFicheproductCost(
    input.annualSheets,
    input.pricePerSheetEur,
  );
  const annualSavingsEur = computeAnnualSavings(manualCostEur, ficheproductCostEur);

  return { manualCostEur, ficheproductCostEur, annualSavingsEur };
}
