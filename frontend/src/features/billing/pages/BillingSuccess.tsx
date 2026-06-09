import { useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router';

import { Button } from '@shared/ui';

import { useBilling } from '../hooks/useBilling';

export function BillingSuccess() {
  const { refresh } = useBilling();

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-6 py-16 text-center">
      <CheckCircle2 className="mb-4 text-green-500" size={48} aria-hidden />
      <h1 className="mb-2 text-2xl font-extrabold text-text-primary">Paiement confirmé</h1>
      <p className="mb-8 text-sm text-text-secondary">
        Merci pour ton achat. Tes crédits seront disponibles dans quelques instants une fois le
        paiement validé par Stripe.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button href="/catalog" variant="primary" size="sm" glow>
          Retour au catalogue
        </Button>
        <Button href="/pricing" variant="neutral-outline" size="sm">
          Voir les tarifs
        </Button>
      </div>
      <p className="mt-6 text-xs text-text-muted">
        Un problème ?{' '}
        <Link to="/profile" className="font-semibold text-purple-600 hover:underline">
          Consulte ton profil
        </Link>
      </p>
    </div>
  );
}
