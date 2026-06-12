import { useCallback, useState } from 'react';

import { patchMyShop } from '@api/shop';
import type { PatchMyShopBody } from '@types-api';

import type { Shop } from '../types';

interface UseShopPatchOptions {
  updateShop: (shop: Shop) => void;
  onUrlSaved?: (url: string) => void;
}

export function useShopPatch({ updateShop, onUrlSaved }: UseShopPatchOptions) {
  const [patching, setPatching] = useState(false);

  const patchShop = useCallback(
    async (partial: PatchMyShopBody) => {
      setPatching(true);
      try {
        const updated = await patchMyShop(partial);
        updateShop(updated);
        if (partial.url !== undefined) {
          onUrlSaved?.(updated.url);
        }
      } finally {
        setPatching(false);
      }
    },
    [onUrlSaved, updateShop],
  );

  return { patchShop, patching };
}
