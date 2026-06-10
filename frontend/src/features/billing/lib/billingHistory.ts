import type { BillingTransactionSummary } from '@api/types/api.types';

const USAGE_REASONS = new Set<BillingTransactionSummary['reason']>(['export', 'expiry', 'refund']);

/** Mouvements de consommation (exports, expirations, remboursements). */
export function filterUsageTransactions(
  transactions: BillingTransactionSummary[],
): BillingTransactionSummary[] {
  return transactions.filter((tx) => USAGE_REASONS.has(tx.reason));
}
