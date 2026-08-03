import { Button, Modal } from '@shared/ui';

export interface ReanalysisConfirmModalProps {
  open: boolean;
  busy?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

/**
 * Modale de confirmation avant de relancer une analyse lorsque l'URL a changé.
 * Avertit l'utilisateur que ses marques et catégories actuelles seront remplacées.
 */
export function ReanalysisConfirmModal({
  open,
  busy = false,
  onClose,
  onConfirm,
}: ReanalysisConfirmModalProps) {
  return (
    <Modal
      open={open}
      title="Confirmer la nouvelle analyse"
      onClose={() => {
        if (!busy) onClose();
      }}
    >
      <h2 className="m-0 text-lg font-semibold text-text-primary">Relancer l&apos;analyse ?</h2>
      <p className="mt-2 text-sm text-text-secondary">
        L&apos;URL a changé. Relancer l&apos;analyse remplacera vos marques et catégories actuelles.
      </p>
      <div className="mt-6 flex justify-end gap-2">
        <Button type="button" variant="neutral-outline" size="sm" disabled={busy} onClick={onClose}>
          Annuler
        </Button>
        <Button type="button" variant="primary" size="sm" disabled={busy} onClick={onConfirm}>
          {busy ? 'Analyse en cours…' : 'Relancer l\u2019analyse'}
        </Button>
      </div>
    </Modal>
  );
}
