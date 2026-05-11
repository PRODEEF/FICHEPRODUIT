import { useEffect, useId, useRef, useState, type ReactNode } from 'react';

import type { PatchMyShopBody } from '@types-api';

import { formatCmsLabel } from '../../catalog/lib/productUtils';
import type { Shop, ShopCms } from '../types';
import { Button } from '@shared/ui/Button';

const CMS_OPTIONS: ShopCms[] = ['prestashop', 'shopify', 'woocommerce', 'autre', 'inconnu'];

type ShopInfoSectionProps = {
  shop: Shop;
  onSavePartial: (patch: PatchMyShopBody) => Promise<void>;
  saving?: boolean;
};

type RowKey = 'name' | 'url' | 'cms' | 'sector';

type Buffers = {
  name: string;
  url: string;
  cms: ShopCms;
  sector: string;
};

function buffersFromShop(shop: Shop): Buffers {
  return {
    name: shop.name,
    url: shop.url,
    cms: shop.cms,
    sector: shop.sector ?? '',
  };
}

export function ShopInfoSection({ shop, onSavePartial, saving = false }: ShopInfoSectionProps) {
  const idBase = useId();
  const [editing, setEditing] = useState<RowKey | null>(null);
  const [buffers, setBuffers] = useState<Buffers>(() => buffersFromShop(shop));
  const [saveError, setSaveError] = useState<string | null>(null);
  const onSavePartialRef = useRef(onSavePartial);

  useEffect(() => {
    onSavePartialRef.current = onSavePartial;
  }, [onSavePartial]);

  useEffect(() => {
    if (editing === null) {
      setBuffers(buffersFromShop(shop));
    }
  }, [shop, editing]);

  const openEdit = (key: RowKey) => {
    setSaveError(null);
    setBuffers(buffersFromShop(shop));
    setEditing(key);
  };

  const cancelEdit = () => {
    setSaveError(null);
    setEditing(null);
    setBuffers(buffersFromShop(shop));
  };

  const saveEdit = async () => {
    if (!editing) return;

    const patch: PatchMyShopBody = {};
    if (editing === 'name' && buffers.name !== shop.name) {
      patch.name = buffers.name;
    }
    if (editing === 'url' && buffers.url !== shop.url) {
      patch.url = buffers.url;
    }
    if (editing === 'cms' && buffers.cms !== shop.cms) {
      patch.cms = buffers.cms;
    }
    if (editing === 'sector') {
      const next = buffers.sector.trim() === '' ? null : buffers.sector.trim();
      if (next !== shop.sector) {
        patch.sector = next;
      }
    }

    if (Object.keys(patch).length === 0) {
      setEditing(null);
      return;
    }

    setSaveError(null);
    try {
      const persist = onSavePartialRef.current;
      if (typeof persist !== 'function') {
        setSaveError('Enregistrement indisponible. Recharge la page.');
        return;
      }
      await persist(patch);
      setEditing(null);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Enregistrement impossible.');
    }
  };

  const row = (key: RowKey, label: string, display: string, edit: ReactNode) => {
    const isEditing = editing === key;
    return (
      <div className="group flex flex-wrap items-center gap-2 py-3">
        <div className="w-28 shrink-0 text-sm text-gray-500">{label}</div>
        <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
          {isEditing ? (
            <div className="min-w-0 flex-1">{edit}</div>
          ) : (
            <span className="truncate text-sm text-gray-900">{display}</span>
          )}
          {!isEditing ? (
            <Button type="button" variant="neutral-outline" size="sm" onClick={() => openEdit(key)}>
              Modifier
            </Button>
          ) : (
            <div className="flex shrink-0 items-center gap-2">
              <Button type="button" variant="secondary" size="sm" disabled={saving} onClick={cancelEdit}>
                Annuler
              </Button>
              <Button type="button" variant="primary" size="sm" onClick={() => void saveEdit()} disabled={saving}>
                {saving ? 'Enregistrement…' : 'Enregistrer'}
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div>
      {saveError ? <p className="mb-2 text-sm text-red-600">{saveError}</p> : null}
      <div className="divide-y divide-gray-100 rounded-xl border border-gray-100 bg-white px-4">
        {row(
          'name',
          'Nom',
          shop.name,
          <input
            id={`${idBase}-name`}
            value={buffers.name}
            onChange={(e) => setBuffers((b) => ({ ...b, name: e.target.value }))}
            className="w-full max-w-md rounded-md border border-gray-200 px-2 py-1 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-400"
          />,
        )}
        {row(
          'url',
          'URL',
          shop.url,
          <input
            id={`${idBase}-url`}
            type="url"
            value={buffers.url}
            onChange={(e) => setBuffers((b) => ({ ...b, url: e.target.value }))}
            className="w-full max-w-md rounded-md border border-gray-200 px-2 py-1 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-400"
          />,
        )}
        {row(
          'cms',
          'CMS',
          formatCmsLabel(shop.cms),
          <select
            id={`${idBase}-cms`}
            value={buffers.cms}
            onChange={(e) => setBuffers((b) => ({ ...b, cms: e.target.value as ShopCms }))}
            className="max-w-md rounded-md border border-gray-200 px-2 py-1 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-400"
          >
            {CMS_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {formatCmsLabel(opt)}
              </option>
            ))}
          </select>,
        )}
        {row(
          'sector',
          'Secteur',
          shop.sector?.trim() ? shop.sector : '—',
          <input
            id={`${idBase}-sector`}
            value={buffers.sector}
            onChange={(e) => setBuffers((b) => ({ ...b, sector: e.target.value }))}
            placeholder="Secteur"
            className="w-full max-w-md rounded-md border border-gray-200 px-2 py-1 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-400"
          />,
        )}
      </div>
    </div>
  );
}
