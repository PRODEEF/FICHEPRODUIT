import type { ShopCategoryNode } from '@types-api';
import { Button, Modal } from '@shared/ui';

export interface CategoryDeleteModalProps {
  /** Nœud à supprimer, ou null si la modale est fermée. */
  nodeToDelete: ShopCategoryNode | null;
  busy: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

/**
 * Modale de confirmation de suppression d'une catégorie.
 * Avertit l'utilisateur si la catégorie possède des sous-catégories.
 */
export function CategoryDeleteModal({
  nodeToDelete,
  busy,
  onClose,
  onConfirm,
}: CategoryDeleteModalProps) {
  return (
    <Modal
      open={nodeToDelete !== null}
      title="Confirmer la suppression"
      onClose={() => {
        if (!busy) onClose();
      }}
    >
      <h2 className="m-0 text-lg font-semibold text-text-primary">Supprimer cette catégorie ?</h2>
      <p className="mt-2 text-sm text-text-secondary">
        {nodeToDelete ? (
          <>
            La catégorie{' '}
            <span className="font-medium text-text-primary">« {nodeToDelete.name} »</span>
            {nodeToDelete.children.length > 0
              ? ' et toutes ses sous-catégories seront retirées.'
              : ' sera retirée de l\u2019arborescence.'}
          </>
        ) : null}
      </p>
      <div className="mt-6 flex justify-end gap-2">
        <Button
          type="button"
          variant="neutral-outline"
          size="sm"
          disabled={busy}
          onClick={onClose}
        >
          Annuler
        </Button>
        <Button
          type="button"
          variant="primary"
          size="sm"
          disabled={busy}
          onClick={onConfirm}
        >
          {busy ? 'Suppression\u2026' : 'Supprimer'}
        </Button>
      </div>
    </Modal>
  );
}
