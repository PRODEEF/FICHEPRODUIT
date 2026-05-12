import { useEffect, useState } from 'react';

import type { CatalogProduct, Shop } from '@types-api';
import { fetchCatalogProductsByShopBrands } from '@api/catalog';

import type { CatalogProductPayloadMetadata } from '../types';
import { buildCatalogProductMetadata } from '../lib/catalogProductMetadata';

interface UseCatalogProductsByIdsResult {
  products: CatalogProduct[] | null;
  metadata: CatalogProductPayloadMetadata | null;
  loading: boolean;
  error: string | null;
}

export function useCatalogProductsByIds(
  shop: Shop | null,
  enabled: boolean,
  guestSessionId?: string | null,
): UseCatalogProductsByIdsResult {
  const [products, setProducts] = useState<CatalogProduct[] | null>(null);
  const [metadata, setMetadata] = useState<CatalogProductPayloadMetadata | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const guard = { cancelled: false };

    void (async () => {
      await Promise.resolve();
      if (!enabled || !shop?.id) {
        setProducts(null);
        setMetadata(null);
        setLoading(false);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const loadedProducts = await fetchCatalogProductsByShopBrands(shop.id, guestSessionId);
        if (guard.cancelled) return;
        setProducts(loadedProducts);
        setMetadata(buildCatalogProductMetadata(loadedProducts));
      } catch (e) {
        if (guard.cancelled) return;
        setProducts(null);
        setMetadata(null);
        setError(e instanceof Error ? e.message : 'Erreur de chargement des produits catalogue.');
      } finally {
        if (!guard.cancelled) setLoading(false);
      }
    })();

    return () => {
      guard.cancelled = true;
    };
  }, [enabled, shop, guestSessionId]);

  return { products, metadata, loading, error };
}
