import { Button, Modal } from '@shared/ui';

export interface ExportConfirmationModalProps {
  open: boolean;
  onClose: () => void;
  selectedCount: number;
  onConfirm: () => void;
}

function pluralize(count: number, singular: string, plural: string): string {
  return count > 1 ? plural : singular;
}

export function ExportConfirmationModal({
  open,
  onClose,
  selectedCount,
  onConfirm,
}: ExportConfirmationModalProps) {
  const ficheLabel = pluralize(selectedCount, 'fiche', 'fiches');

  return (
    <Modal open={open} title="Confirmer l'export" onClose={onClose}>
      <h2 className="mb-4 text-lg font-bold text-text-primary">Confirmer l&apos;export</h2>

      <p className="mb-6 text-sm text-text-secondary">
        Tu as sélectionné {selectedCount} {ficheLabel}. Confirmer l&apos;export ?
      </p>
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="neutral-outline" size="sm" onClick={onClose}>
          Annuler
        </Button>
        <Button type="button" variant="primary" size="sm" glow onClick={onConfirm}>
          Confirmer l&apos;export
        </Button>
      </div>
    </Modal>
  );
}
