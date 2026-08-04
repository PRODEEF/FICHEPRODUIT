import { useCallback, useState } from 'react';

import { patchMyShop } from '@api/shop';
import type { PatchMyShopBody, Shop } from '@types-api';

interface UseShopPatchOptions {
  updateShop: (shop: Shop) => void;
}

export function useShopPatch({ updateShop }: UseShopPatchOptions) {
  const [patching, setPatching] = useState(false);

  const patchShop = useCallback(
    async (partial: PatchMyShopBody) => {
      setPatching(true);
      try {
        const updated = await patchMyShop(partial);
        updateShop(updated);
      } finally {
        setPatching(false);
      }
    },
    [updateShop],
  );

  return { patchShop, patching };
}
