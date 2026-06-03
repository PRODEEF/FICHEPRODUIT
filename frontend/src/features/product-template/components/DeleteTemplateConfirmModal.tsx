import { Button, Modal } from '@shared/ui';

export interface DeleteTemplateConfirmModalProps {
  open: boolean;
  templateName: string;
  deleting: boolean;
  error: string | null;
  onConfirm: () => void;
  onClose: () => void;
}

export function DeleteTemplateConfirmModal({
  open,
  templateName,
  deleting,
  error,
  onConfirm,
  onClose,
}: DeleteTemplateConfirmModalProps) {
  return (
    <Modal open={open} title="Supprimer la fiche type" onClose={deleting ? () => undefined : onClose}>
      <h2 className="product-template-modal-title mb-3">Supprimer la fiche type ?</h2>
      <p className="mb-2 text-sm text-text-secondary">
        Vous allez supprimer définitivement la fiche{' '}
        <span className="font-semibold text-text-primary">{templateName}</span>.
      </p>
      <p className="mb-6 text-sm text-text-secondary">
        Cette action est irréversible : la fiche ne pourra pas être restaurée.
      </p>
      {error ? (
        <p className="analyses-status analyses-status-error mb-4" role="alert">
          {error}
        </p>
      ) : null}
      <div className="product-template-modal-actions">
        <Button
          type="button"
          variant="danger-outline"
          size="sm"
          className="font-semibold"
          disabled={deleting}
          onClick={onConfirm}
        >
          {deleting ? 'Suppression…' : 'Supprimer définitivement'}
        </Button>
        <button
          type="button"
          className="product-templates-draft-cancel"
          disabled={deleting}
          onClick={onClose}
        >
          Annuler
        </button>
      </div>
    </Modal>
  );
}
