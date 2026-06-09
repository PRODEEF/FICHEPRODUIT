import type { BillingCreditLotSummary, BillingTransactionSummary } from '@api/types/api.types';

/** Formate une date ISO en libellé court français. */
export function formatBillingDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatGrantLabel(metadata: Record<string, unknown>): string {
  const source = metadata['source'];
  if (source === 'signup_grant') {
    return "Crédits d'inscription";
  }
  if (source === 'pack_purchase') {
    const planName = metadata['plan_name'];
    if (typeof planName === 'string' && planName.length > 0) {
      return `Achat pack ${planName}`;
    }
    return 'Achat de crédits';
  }
  return 'Octroi de crédits';
}

/** Libellé français d'un mouvement de crédits. */
export function formatTransactionLabel(tx: BillingTransactionSummary): string {
  switch (tx.reason) {
    case 'export':
      return 'Export de fiches';
    case 'refund':
      return 'Remboursement export';
    case 'expiry':
      return 'Expiration de crédits';
    case 'grant':
      return formatGrantLabel(tx.metadata);
    default:
      return tx.reason;
  }
}

/** Libellé français d'un lot de crédits (onglet Achat). */
export function formatPurchaseLabel(lot: BillingCreditLotSummary): string {
  switch (lot.source) {
    case 'signup_grant':
      return "Crédits d'inscription";
    case 'pack_purchase':
      if (lot.planName) {
        return `Achat pack ${lot.planName}`;
      }
      return 'Achat de crédits';
    case 'subscription_grant':
      return 'Abonnement Platinium';
    case 'manual':
      return 'Crédits offerts';
    default:
      return lot.source;
  }
}

/** Sous-titre d'un lot (solde restant, expiration). */
export function formatPurchaseSubtitle(lot: BillingCreditLotSummary): string {
  const parts: string[] = [];

  if (lot.source === 'subscription_grant') {
    if (lot.expiresAt) {
      parts.push(`valable jusqu'au ${formatBillingDate(lot.expiresAt)}`);
    }
    return parts.join(' · ');
  }

  if (lot.amountInitial > 0) {
    parts.push(
      `${lot.amountRemaining} crédit${lot.amountRemaining > 1 ? 's' : ''} restant${lot.amountRemaining > 1 ? 's' : ''}`,
    );
  }

  if (lot.expiresAt) {
    parts.push(`expire le ${formatBillingDate(lot.expiresAt)}`);
  }

  if (lot.sector) {
    parts.push(lot.sector);
  }

  return parts.join(' · ');
}

/** Libellé du statut d'abonnement Stripe. */
export function formatSubscriptionStatus(status: string): string {
  switch (status) {
    case 'active':
      return 'Actif';
    case 'canceled':
      return 'Annulé';
    case 'past_due':
      return 'Paiement en retard';
    case 'trialing':
      return 'Essai';
    default:
      return status;
  }
}
