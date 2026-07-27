import { useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router';

import { Button } from '@shared/ui';

import { useBilling } from '../hooks/useBilling';

export function BillingSuccess() {
  const { summary, loading, refresh } = useBilling();

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const balanceLabel =
    loading && !summary
      ? 'Mise à jour du solde…'
      : summary?.hasUnlimitedExports
        ? 'Ton abonnement est actif — exports illimités.'
        : summary
          ? `Ton solde : ${summary.balance} crédit${summary.balance > 1 ? 's' : ''}.`
          : 'Tes crédits seront disponibles dans quelques instants une fois le paiement validé par Stripe.';

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-6 py-16 text-center">
      <CheckCircle2 className="mb-4 text-green-500" size={48} aria-hidden />
      <h1 className="mb-2 text-2xl font-extrabold text-text-primary">Paiement confirmé</h1>
      <p className="mb-8 text-sm text-text-secondary" aria-busy={loading && !summary}>
        Merci pour ton achat. {balanceLabel}
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button href="/catalog" variant="primary" size="sm" glow>
          Retour au catalogue
        </Button>
        {/* Pricing temporairement désactivé */}
        {/* <Button href="/pricing" variant="neutral-outline" size="sm">
          Voir les tarifs
        </Button> */}
      </div>
      {/* Facturation profil temporairement désactivée — renvoi vers /demo au lieu de /profile */}
      <p className="mt-6 text-xs text-text-muted">
        Un problème ?{' '}
        <Link to="/demo" className="font-semibold text-purple-600 hover:underline">
          Demande une démo
        </Link>
      </p>
    </div>
  );
}
