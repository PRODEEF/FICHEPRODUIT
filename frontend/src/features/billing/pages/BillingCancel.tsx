import { XCircle } from 'lucide-react';

import { Button } from '@shared/ui';

export function BillingCancel() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-6 py-16 text-center">
      <XCircle className="mb-4 text-amber-500" size={48} aria-hidden />
      <h1 className="mb-2 text-2xl font-extrabold text-text-primary">Paiement annulé</h1>
      <p className="mb-8 text-sm text-text-secondary">
        Tu n&apos;as pas été débité. Tu peux reprendre l&apos;achat quand tu veux depuis la page
        tarifs.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button href="/pricing" variant="primary" size="sm" glow>
          Retour aux tarifs
        </Button>
        <Button href="/catalog" variant="neutral-outline" size="sm">
          Mon catalogue
        </Button>
      </div>
    </div>
  );
}
