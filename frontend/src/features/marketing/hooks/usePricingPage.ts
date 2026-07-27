import { useCallback, useEffect, useState } from 'react';

import type { ShopSectorLabel } from '@shared/lib/shopSectors';
import { isShopSectorLabel } from '@shared/lib/shopSectors';

import { DEFAULT_PRICING_SECTOR } from '../lib/pricingConstants';
import { useBillingPlans } from './useBillingPlans';
import { useSavingsSimulator } from './useSavingsSimulator';

export interface UsePricingPageOptions {
  /** Secteur boutique à présélectionner (ex. depuis le magasin de l'utilisateur). */
  initialSector?: ShopSectorLabel | null;
  /** Empêche le changement de secteur (ex. utilisateur connecté). */
  lockSector?: boolean;
  /** Retarde le chargement des forfaits (ex. en attente du secteur boutique). */
  deferPlansFetch?: boolean;
}

export function usePricingPage(options: UsePricingPageOptions = {}) {
  const { lockSector = false, deferPlansFetch = false } = options;

  const initialSector =
    options.initialSector && isShopSectorLabel(options.initialSector)
      ? options.initialSector
      : DEFAULT_PRICING_SECTOR;

  const [sector, setSector] = useState<ShopSectorLabel>(initialSector);

  useEffect(() => {
    if (options.initialSector) {
      // Différé pour éviter un setState synchrone dans le corps de l'effet
      const sector = options.initialSector;
      queueMicrotask(() => {
        setSector(sector);
      });
    }
  }, [options.initialSector]);

  const { plans, plansLoading, plansError, proPricePerSheet, simulatorReady } = useBillingPlans(
    sector,
    { defer: deferPlansFetch },
  );

  const simulator = useSavingsSimulator({
    pricePerSheetEur: proPricePerSheet,
    ready: simulatorReady,
  });

  const selectSector = useCallback(
    (next: ShopSectorLabel) => {
      if (lockSector) return;
      setSector(next);
    },
    [lockSector],
  );

  return {
    sector,
    plans,
    plansLoading,
    plansError,
    selectSector,
    simulatorReady,
    sheetCount: simulator.sheetCount,
    setSheetCount: simulator.setSheetCount,
    minSheetCount: simulator.minSheetCount,
    maxSheetCount: simulator.maxSheetCount,
    manualMinutes: simulator.manualMinutes,
    setManualMinutes: simulator.setManualMinutes,
    minManualMinutes: simulator.minManualMinutes,
    maxManualMinutes: simulator.maxManualMinutes,
    manualMinutesStep: simulator.manualMinutesStep,
    savings: simulator.savings,
  };
}
