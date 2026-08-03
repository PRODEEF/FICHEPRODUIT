import { useId } from 'react';

import type { PatchMyShopBody } from '@types-api';
import { cn } from '@shared/lib/cn';
import { Button } from '@shared/ui';

import { ShopInfoRow } from './ShopInfoRow';
import { useShopInfoEdit } from '../hooks/useShopInfoEdit';
import type { Shop } from '../types';

const INPUT_BASE_CLASS =
  'w-full max-w-md rounded-md border px-2 py-1 text-sm text-gray-900 focus:outline-none focus:ring-2';

interface ShopInfoSectionProps {
  shop: Shop;
  onSavePartial: (patch: PatchMyShopBody) => Promise<void>;
  saving?: boolean;
  showAnalyzeAction?: boolean;
  onAnalyze?: () => void;
  analyzeDisabled?: boolean;
}

export function ShopInfoSection({
  shop,
  onSavePartial,
  saving = false,
  showAnalyzeAction = false,
  onAnalyze,
  analyzeDisabled = false,
}: ShopInfoSectionProps) {
  const idBase = useId();
  const { editing, buffers, fieldError, openEdit, cancelEdit, saveEdit, setBuffersPatch } =
    useShopInfoEdit({ shop, onSavePartial });

  const urlFieldError = fieldError?.key === 'url' ? fieldError.message : null;

  const analyzeButton =
    showAnalyzeAction && onAnalyze ? (
      <Button
        type="button"
        variant="secondary"
        size="sm"
        disabled={analyzeDisabled}
        onClick={onAnalyze}
      >
        Analyser le site
      </Button>
    ) : null;

  return (
    <div>
      <div className="divide-y divide-gray-100 rounded-xl border border-gray-100 bg-white px-4">
        <ShopInfoRow
          rowKey="name"
          label="Nom"
          display={shop.name}
          edit={
            <input
              id={`${idBase}-name`}
              value={buffers.name}
              onChange={(e) => void setBuffersPatch({ name: e.target.value })}
              className={cn(INPUT_BASE_CLASS, 'border-gray-200 focus:ring-purple-400')}
            />
          }
          isEditing={editing === 'name'}
          fieldError={fieldError?.key === 'name' ? fieldError.message : null}
          idBase={idBase}
          saving={saving}
          openEdit={openEdit}
          cancelEdit={cancelEdit}
          saveEdit={saveEdit}
        />
        <ShopInfoRow
          rowKey="url"
          label="URL"
          display={
            shop.url.trim() ? shop.url : <span className="text-gray-500">Non renseignée</span>
          }
          edit={
            <input
              id={`${idBase}-url`}
              type="url"
              value={buffers.url}
              onChange={(e) => void setBuffersPatch({ url: e.target.value })}
              aria-invalid={urlFieldError ? true : undefined}
              aria-describedby={urlFieldError ? `${idBase}-url-error` : undefined}
              placeholder="https://monsite.fr"
              className={cn(
                INPUT_BASE_CLASS,
                urlFieldError
                  ? 'border-red-500 ring-2 ring-red-100 focus:border-red-500 focus:ring-red-100'
                  : 'border-gray-200 focus:ring-purple-400',
              )}
            />
          }
          trailingActions={analyzeButton}
          isEditing={editing === 'url'}
          fieldError={urlFieldError}
          idBase={idBase}
          saving={saving}
          openEdit={openEdit}
          cancelEdit={cancelEdit}
          saveEdit={saveEdit}
        />

        {/* Secteur */}
        <div className="flex flex-wrap items-center gap-2 py-3">
          <div className="w-28 shrink-0 text-sm text-gray-500">Secteur</div>
          <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
            <div className="min-w-0 flex-1 truncate text-sm text-gray-900">{shop.sector}</div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="text-xs text-gray-500">Défini lors de l&apos;inscription.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
