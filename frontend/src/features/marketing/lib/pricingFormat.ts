import { PRICE_EXCL_TAX_LABEL } from './pricingConstants';

/** Formate un montant en euros (locale fr-FR). */
export function formatPriceEur(amount: number, options?: { decimals?: number }): string {
  const decimals = options?.decimals ?? (Number.isInteger(amount) ? 0 : 2);
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}

/** Formate un montant tarifaire avec le suffixe HT. */
export function formatPriceEurExclTax(amount: number, options?: { decimals?: number }): string {
  return `${formatPriceEur(amount, options)} ${PRICE_EXCL_TAX_LABEL}`;
}

/** Arrondit à 2 décimales pour les montants tarifaires. */
export function roundPrice(amount: number): number {
  return Math.round(amount * 100) / 100;
}
