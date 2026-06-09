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

/** Arrondit à 2 décimales pour les montants tarifaires. */
export function roundPrice(amount: number): number {
  return Math.round(amount * 100) / 100;
}
