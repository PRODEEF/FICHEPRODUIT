import { useCallback, useEffect, useRef, useState } from 'react';

import { getMyShop } from '@api/shop';
import type { Shop } from '../types';

export interface UseShopResult {
  shop: Shop | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateShop: (shop: Shop) => void;
}

export function useShop(): UseShopResult {
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const shopRef = useRef<Shop | null>(null);

  useEffect(() => {
    shopRef.current = shop;
  }, [shop]);

  const updateShop = useCallback((next: Shop) => {
    setError(null);
    setShop(next);
  }, []);

  const refetch = useCallback(async () => {
    const isInitialLoad = shopRef.current === null;
    if (isInitialLoad) {
      setLoading(true);
    }
    setError(null);
    try {
      const next = await getMyShop();
      setShop(next);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Erreur de chargement.';
      setError(message);
      setShop(null);
    } finally {
      if (isInitialLoad) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void refetch();
    });
  }, [refetch]);

  return { shop, loading, error, refetch, updateShop };
}
