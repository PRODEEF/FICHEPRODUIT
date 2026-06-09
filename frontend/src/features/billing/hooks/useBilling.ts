import { useBillingContext } from '../context/BillingContext';

export type { BillingContextValue as UseBillingResult } from '../context/BillingContext';

/** Accès au solde et au résumé facturation (contexte partagé). */
export function useBilling() {
  return useBillingContext();
}
