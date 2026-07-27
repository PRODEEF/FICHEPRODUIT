import { Coins } from 'lucide-react';

import { Badge, Button, Card } from '@shared/ui';

import { useBilling } from '../hooks/useBilling';
import { formatBillingDate, formatSubscriptionStatus } from '../lib/billingFormat';
import { BillingHistoryTabs } from './BillingHistoryTabs';

export function BillingAccountSection() {
  const { summary, loading, error, refresh } = useBilling();

  if (loading && !summary) {
    return (
      <Card className="flex flex-col gap-4" aria-busy="true">
        <h2 className="m-0 text-xl font-bold text-text-primary">Crédits & facturation</h2>
        <p className="m-0 text-sm text-text-muted">Chargement…</p>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="flex flex-col gap-4">
        <h2 className="m-0 text-xl font-bold text-text-primary">Crédits & facturation</h2>
        <p className="m-0 text-sm text-red-600" role="alert">
          {error}
        </p>
        <Button type="button" variant="neutral-outline" size="sm" onClick={() => void refresh()}>
          Réessayer
        </Button>
      </Card>
    );
  }

  if (!summary) {
    return null;
  }

  return (
    <Card className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="m-0 text-xl font-bold text-text-primary">Crédits & facturation</h2>
        {/* Pricing temporairement désactivé */}
        {/* <Button href="/pricing" variant="primary" size="sm">
          Acheter des crédits
        </Button> */}
      </div>

      <div className="rounded-xl border border-soft bg-bg-main px-5 py-4">
        <div className="flex items-center gap-3">
          <span
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-purple-50 text-purple-600"
            aria-hidden
          >
            <Coins size={20} />
          </span>
          <div>
            {summary.hasUnlimitedExports ? (
              <>
                <p className="m-0 text-2xl font-bold text-text-primary">Illimité</p>
                <Badge variant="success" className="mt-1">
                  Abonnement actif
                </Badge>
              </>
            ) : (
              <>
                <p className="m-0 text-2xl font-bold tabular-nums text-text-primary">
                  {summary.balance}
                </p>
                <p className="m-0 text-sm text-text-muted">
                  crédit{summary.balance > 1 ? 's' : ''} disponible
                  {summary.balance > 1 ? 's' : ''}
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {summary.subscription?.status ? (
        <div className="rounded-lg border border-soft px-4 py-3 text-sm text-text-secondary">
          <p className="m-0">
            Abonnement :{' '}
            <strong className="text-text-primary">
              {formatSubscriptionStatus(summary.subscription.status)}
            </strong>
            {summary.subscription.periodEnd
              ? ` — renouvellement le ${formatBillingDate(summary.subscription.periodEnd)}`
              : null}
          </p>
        </div>
      ) : null}

      {summary.entitlements.length > 0 ? (
        <ul className="m-0 list-none space-y-2 p-0">
          {summary.entitlements.map((entitlement) => (
            <li
              key={`${entitlement.type}-${entitlement.expiresAt}`}
              className="rounded-lg border border-soft px-4 py-3 text-sm text-text-secondary"
            >
              Fiches &lt; 200 € offertes jusqu&apos;au {formatBillingDate(entitlement.expiresAt)}
            </li>
          ))}
        </ul>
      ) : null}

      <BillingHistoryTabs
        purchases={summary.recentPurchases}
        transactions={summary.recentTransactions}
      />
    </Card>
  );
}
