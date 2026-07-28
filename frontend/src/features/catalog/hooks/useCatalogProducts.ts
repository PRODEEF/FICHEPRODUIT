import { useEffect, useMemo, useState } from 'react';

import type { CatalogProduct, Shop } from '@types-api';
import { fetchCatalogProductsByShopBrands, searchCatalogProducts } from '@api/catalog';

import type { CatalogProductPayloadMetadata } from '../types';
import { buildCatalogProductMetadata } from '../lib/catalogProductMetadata';

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
 */
export function useCatalogProducts({
  shop,
  shopLoading,
}: UseCatalogProductsParams): UseCatalogProductsResult {
  const brandsSignature = useMemo(
    () =>
      (shop?.brands ?? [])
        .map((b) => b.trim())
        .filter(Boolean)
        .join('\u0001'),
    [shop?.brands],
  );

  const [products, setProducts] = useState<CatalogProduct[] | null>(null);
  const [metadata, setMetadata] = useState<CatalogProductPayloadMetadata | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const guard = { cancelled: false };

    void (async () => {
      if (shopLoading) {
        setProducts(null);
        setMetadata(null);
        setLoading(true);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const hasShopBrands = Boolean(shop?.brands.some((b) => b.trim()));
        const loaded =
          hasShopBrands && shop
            ? await fetchCatalogProductsByShopBrands(shop.id)
            : await searchCatalogProducts({ limit: 500 });
        if (guard.cancelled) return;
        setProducts(loaded);
        setMetadata(buildCatalogProductMetadata(loaded));
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
  }, [shopLoading, shop, brandsSignature]);

  const pendingInitialLoad = !shopLoading && products === null && error === null;

  return {
    products,
    productPayload: metadata,
    loading: loading || pendingInitialLoad,
    error,
  };
}
