import { useEffect, useId, useRef, useState, type ReactNode } from 'react';

import { ApiHttpError } from '@api/apiAuth';
import type { PatchMyShopBody } from '@types-api';
import { cn } from '@shared/lib/cn';
import { Button } from '@shared/ui';
import { formatCmsLabel } from '@shared/lib/formatCmsLabel';

import {
  SHOP_URL_INVALID_MESSAGE,
  shopSectorRequiredSchema,
  shopUrlSchema,
} from '../lib/shopSchemas';
import { type Shop, type ShopCms, SHOP_SECTOR_LABELS, isShopSectorLabel } from '../types';

const CMS_OPTIONS: ShopCms[] = ['prestashop', 'shopify', 'woocommerce', 'autre', 'inconnu'];

const INPUT_BASE_CLASS =
  'w-full max-w-md rounded-md border px-2 py-1 text-sm text-gray-900 focus:outline-none focus:ring-2';

interface ShopInfoSectionProps {
  shop: Shop;
  onSavePartial: (patch: PatchMyShopBody) => Promise<void>;
  saving?: boolean;
  hideUrlRow?: boolean;
  showAnalyzeAction?: boolean;
  onAnalyze?: () => void;
  analyzeDisabled?: boolean;
}

type RowKey = 'name' | 'url' | 'cms' | 'sector';

interface FieldError { key: RowKey; message: string }

interface Buffers {
  name: string;
  url: string;
  cms: ShopCms;
  sector: string;
}

function sectorBufferFromShop(shop: Shop): string {
  const raw = shop.sector?.trim();
  if (!raw) return '';
  return raw;
}

function buffersFromShop(shop: Shop): Buffers {
  return {
    name: shop.name,
    url: shop.url,
    cms: shop.cms,
    sector: sectorBufferFromShop(shop),
  };
}

function isLegacySector(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.length > 0 && !isShopSectorLabel(trimmed);
}

function mapSaveError(editing: RowKey, error: unknown): string {
  if (error instanceof ApiHttpError && error.status === 422 && editing === 'url') {
    return SHOP_URL_INVALID_MESSAGE;
  }
  return error instanceof Error ? error.message : 'Enregistrement impossible.';
}

export function ShopInfoSection({
  shop,
  onSavePartial,
  saving = false,
  hideUrlRow = false,
  showAnalyzeAction = false,
  onAnalyze,
  analyzeDisabled = false,
}: ShopInfoSectionProps) {
  const idBase = useId();
  const [editing, setEditing] = useState<RowKey | null>(null);
  const [draft, setDraft] = useState<Buffers | null>(null);
  const [fieldError, setFieldError] = useState<FieldError | null>(null);
  const onSavePartialRef = useRef(onSavePartial);

  useEffect(() => {
    onSavePartialRef.current = onSavePartial;
  }, [onSavePartial]);

  const buffers: Buffers =
    editing === null ? buffersFromShop(shop) : (draft ?? buffersFromShop(shop));

  const legacySector = sectorBufferFromShop(shop);
  const showLegacyOption = isLegacySector(legacySector);

  const clearFieldError = (key?: RowKey) => {
    setFieldError((prev) => {
      if (!prev) return null;
      if (key === undefined || prev.key === key) return null;
      return prev;
    });
  };

  const openEdit = (key: RowKey) => {
    clearFieldError();
    setDraft(buffersFromShop(shop));
    setEditing(key);
  };

  const cancelEdit = () => {
    clearFieldError();
    setEditing(null);
    setDraft(null);
  };

  const saveEdit = async () => {
    if (!editing) return;

    const patch: PatchMyShopBody = {};
    if (editing === 'name' && buffers.name !== shop.name) {
      patch.name = buffers.name;
    }
    if (editing === 'url') {
      const parsed = shopUrlSchema.safeParse(buffers.url);
      if (!parsed.success) {
        setFieldError({
          key: 'url',
          message: parsed.error.issues[0]?.message ?? SHOP_URL_INVALID_MESSAGE,
        });
        return;
      }
      if (parsed.data !== shop.url) {
        patch.url = parsed.data;
      }
    }
    if (editing === 'cms' && buffers.cms !== shop.cms) {
      patch.cms = buffers.cms;
    }
    if (editing === 'sector') {
      const parsed = shopSectorRequiredSchema.safeParse(buffers.sector);
      if (!parsed.success) {
        setFieldError({
          key: 'sector',
          message: parsed.error.issues[0]?.message ?? 'Veuillez choisir un secteur dans la liste.',
        });
        return;
      }
      const next = parsed.data;
      if (next !== shop.sector) {
        patch.sector = next;
      }
    }

    if (Object.keys(patch).length === 0) {
      setEditing(null);
      setDraft(null);
      return;
    }

    clearFieldError(editing);
    try {
      const persist = onSavePartialRef.current;
      if (typeof persist !== 'function') {
        setFieldError({
          key: editing,
          message: 'Enregistrement indisponible. Recharge la page.',
        });
        return;
      }
      await persist(patch);
      setEditing(null);
      setDraft(null);
    } catch (e) {
      setFieldError({ key: editing, message: mapSaveError(editing, e) });
    }
  };

  const row = (
    key: RowKey,
    label: string,
    display: ReactNode,
    edit: ReactNode,
    options?: { trailingActions?: ReactNode },
  ) => {
    const isEditing = editing === key;
    const errorMessage = fieldError?.key === key ? fieldError.message : null;

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
                {options?.trailingActions}
                <Button
                  type="button"
                  variant="neutral-outline"
                  size="sm"
                  onClick={() => void openEdit(key)}
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
        {errorMessage ? (
          <p className="mt-1 pl-[7.5rem] text-sm text-red-500" role="alert">
            {errorMessage}
          </p>
        ) : null}
      </div>
    );
  };

  const setBuffersPatch = (partial: Partial<Buffers>) => {
    if (editing) clearFieldError(editing);
    setDraft((prev) => ({ ...(prev ?? buffersFromShop(shop)), ...partial }));
  };

  const sectorLocked = Boolean(shop.sector?.trim());
  const sectorDisplay = sectorLocked ? shop.sector : '—';
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
        {row(
          'name',
          'Nom',
          shop.name,
          <input
            id={`${idBase}-name`}
            value={buffers.name}
            onChange={(e) => void setBuffersPatch({ name: e.target.value })}
            className={cn(INPUT_BASE_CLASS, 'border-gray-200 focus:ring-purple-400')}
          />,
        )}
        {hideUrlRow
          ? null
          : row(
              'url',
              'URL',
              shop.url.trim() ? shop.url : <span className="text-gray-500">Non renseignée</span>,
              <input
                id={`${idBase}-url`}
                type="url"
                value={buffers.url}
                onChange={(e) => void setBuffersPatch({ url: e.target.value })}
                aria-invalid={urlFieldError ? true : undefined}
                className={cn(
                  INPUT_BASE_CLASS,
                  urlFieldError
                    ? 'border-red-500 ring-2 ring-red-100 focus:border-red-500 focus:ring-red-100'
                    : 'border-gray-200 focus:ring-purple-400',
                )}
              />,
              { trailingActions: analyzeButton },
            )}
        {row(
          'cms',
          'CMS',
          formatCmsLabel(shop.cms),
          <select
            id={`${idBase}-cms`}
            value={buffers.cms}
            onChange={(e) => void setBuffersPatch({ cms: e.target.value as ShopCms })}
            className={cn(INPUT_BASE_CLASS, 'max-w-md border-gray-200 focus:ring-purple-400')}
          >
            {CMS_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {formatCmsLabel(opt)}
              </option>
            ))}
          </select>,
        )}
        {sectorLocked ? (
          <div className="py-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="w-28 shrink-0 text-sm text-gray-500">Secteur</div>
              <div className="min-w-0 flex-1 truncate text-sm text-gray-900">{sectorDisplay}</div>
            </div>
          </div>
        ) : (
          <>
            {row(
              'sector',
              'Secteur',
              sectorDisplay,
              <select
                id={`${idBase}-sector`}
                value={buffers.sector}
                onChange={(e) => void setBuffersPatch({ sector: e.target.value })}
                className={cn(INPUT_BASE_CLASS, 'max-w-md border-gray-200 focus:ring-purple-400')}
              >
                <option value="" disabled>
                  — Sélectionnez votre secteur —
                </option>
                {showLegacyOption ? (
                  <option value={legacySector}>{legacySector} (hors liste)</option>
                ) : null}
                {SHOP_SECTOR_LABELS.map((sectorLabel) => (
                  <option key={sectorLabel} value={sectorLabel}>
                    {sectorLabel}
                  </option>
                ))}
              </select>,
            )}
            <p className="-mt-1 pb-3 pl-[7.5rem] text-xs text-gray-500">
              Le secteur ne peut être défini qu&apos;une seule fois.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
