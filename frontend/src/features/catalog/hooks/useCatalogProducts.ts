import { useEffect, useMemo, useState } from 'react';

import type { CatalogProduct, Shop } from '@types-api';
import { fetchCatalogProductsByShopBrands, searchCatalogProducts } from '@api/catalog';

import type { CatalogProductPayloadMetadata } from '../types';
import { buildCatalogProductMetadata } from '../lib/catalogProductMetadata';
import {
  buildCatalogProductsCacheKey,
  getCatalogProductsCache,
  getLastCatalogProductsCache,
  setCatalogProductsCache,
} from '../lib/catalogProductsCache';

export interface UseCatalogProductsParams {
  shop: Shop | null;
  shopLoading: boolean;
}

export interface UseCatalogProductsResult {
  products: CatalogProduct[] | null;
  productPayload: CatalogProductPayloadMetadata | null;
  loading: boolean;
  error: string | null;
}

/**
 * Charge les exemples catalogue sur `/catalog` : par marques du magasin si possible, sinon
 * recherche large (`POST /api/catalog/products/search` sans marques), sans exiger d’analyse.
 * Conserve les produits en cache module pour éviter un flash au remount (stale-while-revalidate).
 */
export function useCatalogProducts({
  shop,
  shopLoading,
}: UseCatalogProductsParams): UseCatalogProductsResult {
  const shopId = shop?.id;
  const brandsSignature = useMemo(
    () =>
      (shop?.brands ?? [])
        .map((b) => b.trim())
        .filter(Boolean)
        .join('\u0001'),
    [shop?.brands],
  );

  const cacheKey = buildCatalogProductsCacheKey(shopId, brandsSignature);

  const [products, setProducts] = useState<CatalogProduct[] | null>(() => {
    const cached = getCatalogProductsCache(cacheKey) ?? getLastCatalogProductsCache();
    return cached?.products ?? null;
  });
  const [metadata, setMetadata] = useState<CatalogProductPayloadMetadata | null>(() => {
    const cached = getCatalogProductsCache(cacheKey) ?? getLastCatalogProductsCache();
    return cached?.metadata ?? null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const guard = { cancelled: false };

    void (async () => {
      const cached = getCatalogProductsCache(cacheKey) ?? getLastCatalogProductsCache();
      if (cached) {
        setProducts(cached.products);
        setMetadata(cached.metadata);
      }

      if (shopLoading) {
        // Ne pas vider l'UI : loading seulement s'il n'y a rien à afficher.
        setLoading(cached === null);
        setError(null);
        return;
      }

      // Stale-while-revalidate : garder les produits affichés pendant le refetch.
      setLoading(cached === null);
      setError(null);

      try {
        const hasShopBrands = brandsSignature.length > 0;
        const loaded =
          hasShopBrands && shopId
            ? await fetchCatalogProductsByShopBrands(shopId)
            : await searchCatalogProducts({ limit: 500 });
        if (guard.cancelled) return;
        const nextMetadata = buildCatalogProductMetadata(loaded);
        setProducts(loaded);
        setMetadata(nextMetadata);
        setCatalogProductsCache(cacheKey, { products: loaded, metadata: nextMetadata });
      } catch (e) {
        if (guard.cancelled) return;
        // Ne blanker l'UI que s'il n'y a aucune donnée précédente / cache.
        if (!cached) {
          setProducts(null);
          setMetadata(null);
        }
        setError(e instanceof Error ? e.message : 'Erreur de chargement des produits catalogue.');
      } finally {
        if (!guard.cancelled) setLoading(false);
      }
    })();

    return () => {
      guard.cancelled = true;
    };
  }, [shopLoading, shopId, brandsSignature, cacheKey]);

  const pendingInitialLoad = !shopLoading && products === null && error === null;

  return {
    products,
    productPayload: metadata,
    loading: loading || pendingInitialLoad,
    error,
  };
}
