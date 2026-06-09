import { ShoppingBag } from 'lucide-react';

import type { BillingCreditLotSummary } from '@api/types/api.types';

import {
  formatBillingDate,
  formatPurchaseLabel,
  formatPurchaseSubtitle,
} from '../lib/billingFormat';

interface BillingPurchaseListProps {
  purchases: BillingCreditLotSummary[];
}

export function BillingPurchaseList({ purchases }: BillingPurchaseListProps) {
  if (purchases.length === 0) {
    return (
      <p className="m-0 rounded-lg border border-dashed border-soft px-4 py-6 text-center text-sm text-text-muted">
        Aucun achat enregistré pour le moment.
      </p>
    );
  }

  return (
    <ul className="m-0 list-none space-y-2 p-0">
      {purchases.map((lot) => {
        const subtitle = formatPurchaseSubtitle(lot);
        const creditAmount =
          lot.source === 'subscription_grant' ? null : `+${lot.amountInitial}`;

        return (
          <li
            key={lot.id}
            className="flex items-center gap-3 rounded-lg border border-soft bg-bg-white px-3 py-2.5"
          >
            <span
              className="flex size-8 shrink-0 items-center justify-center rounded-full bg-purple-50 text-purple-600"
              aria-hidden
            >
              <ShoppingBag size={16} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="m-0 truncate text-sm font-medium text-text-primary">
                {formatPurchaseLabel(lot)}
              </p>
              <p className="m-0 text-xs text-text-muted">
                {formatBillingDate(lot.createdAt)}
                {subtitle ? ` · ${subtitle}` : ''}
              </p>
            </div>
            {creditAmount ? (
              <span className="shrink-0 text-sm font-semibold tabular-nums text-green-600">
                {creditAmount}
              </span>
            ) : (
              <span className="shrink-0 text-xs font-medium text-purple-600">Illimité</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
