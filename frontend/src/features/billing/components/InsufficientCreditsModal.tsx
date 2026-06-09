import { Button, Modal } from '@shared/ui';

export interface InsufficientCreditsModalProps {
  open: boolean;
  onClose: () => void;
  requiredCredits: number;
  availableCredits: number;
}

export function InsufficientCreditsModal({
  open,
  onClose,
  requiredCredits,
  availableCredits,
}: InsufficientCreditsModalProps) {
  const detail = `Tu as ${availableCredits} crédit${availableCredits > 1 ? 's' : ''} mais cet export en nécessite ${requiredCredits}.`;

  return (
    <Modal open={open} title="Crédits insuffisants" onClose={onClose}>
      <p className="mb-6 text-sm text-text-secondary">{detail}</p>
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="neutral-outline" size="sm" onClick={onClose}>
          Fermer
        </Button>
        <Button href="/pricing" variant="primary" size="sm" glow onClick={onClose}>
          Acheter des crédits
        </Button>
      </div>
    </Modal>
  );
}
