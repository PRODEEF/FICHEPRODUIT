import { Badge, Button, Modal } from '@shared/ui';

import { EXPORT_FREE_PRICE_THRESHOLD_EUR } from '../lib/estimateExportCredits';
import { formatBillingDate } from '../../billing/lib/billingFormat';

export interface ExportConfirmationModalProps {
  open: boolean;
  onClose: () => void;
  selectedCount: number;
  requiredCredits: number;
  availableCredits: number;
  hasEnoughCredits: boolean;
  hasUnlimitedExports: boolean;
  hasFreeLowPriceExports: boolean;
  freeExportCount: number;
  freeLowPriceExportsExpiresAt?: string | null | undefined;
  onConfirm: () => void;
}

function pluralize(count: number, singular: string, plural: string): string {
  return count > 1 ? plural : singular;
}

export function ExportConfirmationModal({
  open,
  onClose,
  selectedCount,
  requiredCredits,
  availableCredits,
  hasEnoughCredits,
  hasUnlimitedExports,
  hasFreeLowPriceExports,
  freeExportCount,
  freeLowPriceExportsExpiresAt,
  onConfirm,
}: ExportConfirmationModalProps) {
  const ficheLabel = pluralize(selectedCount, 'fiche', 'fiches');
  const creditLabel = pluralize(requiredCredits, 'crédit', 'crédits');
  const balanceLabel = pluralize(availableCredits, 'crédit', 'crédits');
  const freeFicheLabel = pluralize(freeExportCount, 'fiche', 'fiches');

  const title = hasEnoughCredits ? "Confirmer l'export" : 'Crédits insuffisants';

  const detail = hasEnoughCredits
    ? hasUnlimitedExports
      ? `Tu as sélectionné ${selectedCount} ${ficheLabel}. Export illimité — aucun crédit ne sera débité.`
      : `Tu as sélectionné ${selectedCount} ${ficheLabel}. Cet export coûtera ${requiredCredits} ${creditLabel}. Solde actuel : ${availableCredits} ${balanceLabel}.`
    : `Tu as ${availableCredits} ${balanceLabel} mais cet export en nécessite ${requiredCredits}.`;

  const showFreeLowPriceBadge = hasFreeLowPriceExports && !hasUnlimitedExports;

  return (
    <Modal open={open} title={title} onClose={onClose}>
      <h2 className="mb-4 text-lg font-bold text-text-primary">{title}</h2>

      {showFreeLowPriceBadge ? (
        <div className="mb-4 flex flex-col gap-2">
          <Badge variant="success" className="w-fit text-xs">
            Forfait fiches &lt; {EXPORT_FREE_PRICE_THRESHOLD_EUR} € offertes
          </Badge>
          {freeLowPriceExportsExpiresAt ? (
            <p className="m-0 text-xs text-text-muted">
              Actif jusqu&apos;au {formatBillingDate(freeLowPriceExportsExpiresAt)}
            </p>
          ) : null}
          {freeExportCount > 0 ? (
            <p className="m-0 text-sm text-emerald-800">
              {freeExportCount} {freeFicheLabel} de ta sélection{' '}
              {freeExportCount > 1 ? 'sont' : 'est'} offerte{freeExportCount > 1 ? 's' : ''}.
            </p>
          ) : null}
        </div>
      ) : null}

      <p className="mb-6 text-sm text-text-secondary">{detail}</p>
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="neutral-outline" size="sm" onClick={onClose}>
          {hasEnoughCredits ? 'Annuler' : 'Fermer'}
        </Button>
        {hasEnoughCredits ? (
          <Button type="button" variant="primary" size="sm" glow onClick={onConfirm}>
            Confirmer l&apos;export
          </Button>
        ) : (
          <Button href="/pricing" variant="primary" size="sm" glow onClick={onClose}>
            Acheter des crédits
          </Button>
        )}
      </div>
    </Modal>
  );
}
