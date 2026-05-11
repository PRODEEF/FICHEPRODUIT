import { useCallback, useEffect, useState } from 'react';

import { getMyShop } from '@api/shop';
import type { Shop } from '../types';

export type UseShopResult = {
  shop: Shop | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

export function useShop(): UseShopResult {
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const next = await getMyShop();
      setShop(next);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Erreur de chargement.';
      setError(message);
      setShop(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { shop, loading, error, refetch };
}
