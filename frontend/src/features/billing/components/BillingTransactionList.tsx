import { ArrowDownRight, ArrowUpRight } from 'lucide-react';

import type { BillingTransactionSummary } from '@api/types/api.types';
import { cn } from '@shared/lib/cn';

import { formatBillingDate, formatTransactionLabel } from '../lib/billingFormat';

interface BillingTransactionListProps {
  transactions: BillingTransactionSummary[];
  emptyMessage?: string;
}

export function BillingTransactionList({
  transactions,
  emptyMessage = 'Aucun mouvement de crédits pour le moment.',
}: BillingTransactionListProps) {
  if (transactions.length === 0) {
    return (
      <p className="m-0 rounded-lg border border-dashed border-soft px-4 py-6 text-center text-sm text-text-muted">
        {emptyMessage}
      </p>
    );
  }

  return (
    <ul className="m-0 list-none space-y-2 p-0">
      {transactions.map((tx) => {
        const isCredit = tx.delta > 0;
        const Icon = isCredit ? ArrowUpRight : ArrowDownRight;

        return (
          <li
            key={tx.id}
            className="flex items-center gap-3 rounded-lg border border-soft bg-bg-white px-3 py-2.5"
          >
            <span
              className={cn(
                'flex size-8 shrink-0 items-center justify-center rounded-full',
                isCredit ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600',
              )}
              aria-hidden
            >
              <Icon size={16} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="m-0 truncate text-sm font-medium text-text-primary">
                {formatTransactionLabel(tx)}
              </p>
              <p className="m-0 text-xs text-text-muted">{formatBillingDate(tx.createdAt)}</p>
            </div>
            <span
              className={cn(
                'shrink-0 text-sm font-semibold tabular-nums',
                isCredit ? 'text-green-600' : 'text-red-600',
              )}
            >
              {isCredit ? '+' : ''}
              {tx.delta}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
