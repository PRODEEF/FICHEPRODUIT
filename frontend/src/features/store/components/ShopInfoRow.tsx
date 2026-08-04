import type { ReactNode } from 'react';

import { Button } from '@shared/ui';

import type { ShopInfoRowKey } from '../lib/shopSchemas';

interface ShopInfoRowProps {
  rowKey: ShopInfoRowKey;
  label: string;
  display: ReactNode;
  edit: ReactNode;
  trailingActions?: ReactNode;
  isEditing: boolean;
  fieldError: string | null;
  idBase: string;
  saving: boolean;
  openEdit: (key: ShopInfoRowKey) => void;
  cancelEdit: () => void;
  saveEdit: () => void | Promise<void>;
}

export function ShopInfoRow({
  rowKey,
  label,
  display,
  edit,
  trailingActions,
  isEditing,
  fieldError,
  idBase,
  saving,
  openEdit,
  cancelEdit,
  saveEdit,
}: ShopInfoRowProps) {
  const errorId = `${idBase}-${rowKey}-error`;

  return (
    <div className="group py-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="w-28 shrink-0 text-sm text-gray-500">{label}</div>
        <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
          {isEditing ? (
            <div className="min-w-0 flex-1">{edit}</div>
          ) : (
            <div className="min-w-0 flex-1 truncate text-sm text-gray-900">{display}</div>
          )}
          {!isEditing ? (
            <div className="flex shrink-0 items-center gap-2">
              {trailingActions}
              <Button
                type="button"
                variant="neutral-outline"
                size="sm"
                onClick={() => void openEdit(rowKey)}
              >
                Modifier
              </Button>
            </div>
          ) : (
            <div className="flex shrink-0 items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={saving}
                onClick={cancelEdit}
              >
                Annuler
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => void saveEdit()}
                disabled={saving}
              >
                {saving ? 'Enregistrement…' : 'Enregistrer'}
              </Button>
            </div>
          )}
        </div>
      </div>
      {fieldError ? (
        <p id={errorId} className="mt-1 pl-[7.5rem] text-sm text-red-500" role="alert">
          {fieldError}
        </p>
      ) : null}
    </div>
  );
}
