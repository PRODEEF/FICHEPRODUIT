import { useState } from 'react';

import type { BillingCreditLotSummary, BillingTransactionSummary } from '@api/types/api.types';
import { cn } from '@shared/lib/cn';

import { filterUsageTransactions } from '../lib/billingHistory';
import { BillingPurchaseList } from './BillingPurchaseList';
import { BillingTransactionList } from './BillingTransactionList';

type BillingHistoryTab = 'achat' | 'utilisation';

interface BillingHistoryTabsProps {
  purchases: BillingCreditLotSummary[];
  transactions: BillingTransactionSummary[];
}

export function BillingHistoryTabs({ purchases, transactions }: BillingHistoryTabsProps) {
  const [activeTab, setActiveTab] = useState<BillingHistoryTab>('achat');
  const usageTransactions = filterUsageTransactions(transactions);

  return (
    <div>
      <h3 className="m-0 mb-3 text-sm font-semibold text-text-primary">Historique</h3>
      <div
        className="mb-4 grid grid-cols-2 border-b border-soft"
        role="tablist"
        aria-label="Historique des crédits"
      >
        <button
          type="button"
          role="tab"
          id="billing-tab-achat"
          aria-selected={activeTab === 'achat'}
          aria-controls="billing-panel-achat"
          className={cn(
            'cursor-pointer border-0 bg-transparent px-2 py-2.5 text-center text-sm font-semibold transition-colors',
            activeTab === 'achat'
              ? 'border-b-2 border-purple-600 text-purple-700'
              : 'text-text-muted hover:text-purple-400',
          )}
          onClick={() => void setActiveTab('achat')}
        >
          Achat
        </button>
        <button
          type="button"
          role="tab"
          id="billing-tab-utilisation"
          aria-selected={activeTab === 'utilisation'}
          aria-controls="billing-panel-utilisation"
          className={cn(
            'cursor-pointer border-0 bg-transparent px-2 py-2.5 text-center text-sm font-semibold transition-colors',
            activeTab === 'utilisation'
              ? 'border-b-2 border-purple-600 text-purple-700'
              : 'text-text-muted hover:text-purple-400',
          )}
          onClick={() => void setActiveTab('utilisation')}
        >
          Utilisation
        </button>
      </div>

      <div
        id="billing-panel-achat"
        role="tabpanel"
        aria-labelledby="billing-tab-achat"
        hidden={activeTab !== 'achat'}
      >
        <BillingPurchaseList purchases={purchases} />
      </div>
      <div
        id="billing-panel-utilisation"
        role="tabpanel"
        aria-labelledby="billing-tab-utilisation"
        hidden={activeTab !== 'utilisation'}
      >
        <BillingTransactionList
          transactions={usageTransactions}
          emptyMessage="Aucune utilisation de crédits pour le moment."
        />
      </div>
    </div>
  );
}
