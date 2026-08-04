import { useEffect, useRef, useState } from 'react';

import type { PatchMyShopBody, Shop } from '@types-api';

import {
  mapShopSaveError,
  SHOP_URL_INVALID_MESSAGE,
  shopUrlSchema,
  type ShopInfoRowKey,
} from '../lib/shopSchemas';

interface ShopInfoBuffers {
  name: string;
  url: string;
}

interface ShopInfoFieldError {
  key: ShopInfoRowKey;
  message: string;
}

interface UseShopInfoEditOptions {
  shop: Shop;
  onSavePartial: (patch: PatchMyShopBody) => Promise<void>;
}

function buffersFromShop(shop: Shop): ShopInfoBuffers {
  return {
    name: shop.name,
    url: shop.url,
  };
}

/**
 * État d’édition inline des champs boutique (nom, URL) avec validation Zod au save.
 */
export function useShopInfoEdit({ shop, onSavePartial }: UseShopInfoEditOptions) {
  const [editing, setEditing] = useState<ShopInfoRowKey | null>(null);
  const [draft, setDraft] = useState<ShopInfoBuffers | null>(null);
  const [fieldError, setFieldError] = useState<ShopInfoFieldError | null>(null);
  const onSavePartialRef = useRef(onSavePartial);

  useEffect(() => {
    onSavePartialRef.current = onSavePartial;
  }, [onSavePartial]);

  const buffers: ShopInfoBuffers =
    editing === null ? buffersFromShop(shop) : (draft ?? buffersFromShop(shop));

  const clearFieldError = (key?: ShopInfoRowKey) => {
    setFieldError((prev) => {
      if (!prev) return null;
      if (key === undefined || prev.key === key) return null;
      return prev;
    });
  };

  const openEdit = (key: ShopInfoRowKey) => {
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
      setFieldError({ key: editing, message: mapShopSaveError(editing, e) });
    }
  };

  const setBuffersPatch = (partial: Partial<ShopInfoBuffers>) => {
    if (editing) clearFieldError(editing);
    setDraft((prev) => ({ ...(prev ?? buffersFromShop(shop)), ...partial }));
  };

  return {
    editing,
    buffers,
    fieldError,
    openEdit,
    cancelEdit,
    saveEdit,
    setBuffersPatch,
  };
}
