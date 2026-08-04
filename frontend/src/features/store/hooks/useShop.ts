import { useCallback, useEffect, useRef, useState } from 'react';

import { getMyShop } from '@api/shop';
import { useAuth } from '@shared/hooks/useAuth';

import { clearShopCache, getShopCache, setShopCache } from '../lib/shopCache';
import type { Shop } from '../types';

export interface UseShopResult {
  shop: Shop | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateShop: (shop: Shop) => void;
}

export function useShop(): UseShopResult {
  const { user } = useAuth();
  const userId = user?.id;

  const [shop, setShop] = useState<Shop | null>(() => getShopCache(userId));
  const [loading, setLoading] = useState(() => {
    if (!userId) return false;
    return getShopCache(userId) === null;
  });
  const [error, setError] = useState<string | null>(null);
  const shopRef = useRef<Shop | null>(getShopCache(userId));

  useEffect(() => {
    shopRef.current = shop;
  }, [shop]);

  const updateShop = useCallback(
    (next: Shop) => {
      setError(null);
      setShop(next);
      if (userId) {
        setShopCache(userId, next);
      }
    },
    [userId],
  );

  const refetch = useCallback(async () => {
    if (!userId) {
      setShop(null);
      setLoading(false);
      return;
    }

    // Stale-while-revalidate : spinner seulement s'il n'y a rien à afficher.
    const isInitialLoad = shopRef.current === null;
    if (isInitialLoad) {
      setLoading(true);
    }
    setError(null);
    try {
      const next = await getMyShop();
      setShop(next);
      setShopCache(userId, next);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Erreur de chargement.';
      setError(message);
      if (shopRef.current === null) {
        setShop(null);
        setShopCache(userId, null);
      }
    } finally {
      if (isInitialLoad) {
        setLoading(false);
      }
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      clearShopCache();
      // Différé pour respecter react-hooks/set-state-in-effect.
      queueMicrotask(() => {
        setShop(null);
        setError(null);
        setLoading(false);
      });
      return;
    }

    queueMicrotask(() => {
      void refetch();
    });
  }, [refetch, userId]);

  return { shop, loading, error, refetch, updateShop };
}
