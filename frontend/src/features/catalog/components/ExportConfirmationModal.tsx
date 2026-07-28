import { Button, Modal } from '@shared/ui';

export interface ExportConfirmationModalProps {
  open: boolean;
  onClose: () => void;
  selectedCount: number;
  onConfirm: () => void;
  isExporting?: boolean;
}

function pluralize(count: number, singular: string, plural: string): string {
  return count > 1 ? plural : singular;
}

export function ExportConfirmationModal({
  open,
  onClose,
  selectedCount,
  onConfirm,
  isExporting = false,
}: ExportConfirmationModalProps) {
  const ficheLabel = pluralize(selectedCount, 'fiche', 'fiches');

  return (
    <Modal open={open} title="Confirmer l'export" onClose={onClose}>
      <h2 className="mb-4 text-lg font-bold text-text-primary">Confirmer l&apos;export</h2>

      <p className="mb-2 text-sm text-text-secondary">
        Tu as sélectionné {selectedCount} {ficheLabel}. Confirmer l&apos;export PrestaShop&nbsp;?
      </p>
      <p className="mb-6 text-sm text-text-secondary">
        Deux fichiers seront téléchargés à la suite&nbsp;: <strong>products.csv</strong> puis{' '}
        <strong>combinations.csv</strong>, importables dans PrestaShop 8.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="neutral-outline"
          size="sm"
          disabled={isExporting}
          onClick={onClose}
        >
          Annuler
        </Button>
        <Button
          type="button"
          variant="primary"
          size="sm"
          glow
          disabled={isExporting}
          onClick={onConfirm}
        >
          {isExporting ? 'Export en cours…' : "Confirmer l'export"}
        </Button>
      </div>
    </Modal>
  );
}
