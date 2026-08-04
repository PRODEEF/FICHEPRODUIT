import { useEffect, useState } from 'react';

import type { CatalogProduct, Shop } from '@types-api';
import { searchCatalogProducts } from '@api/catalog';
import { CATALOG_SEARCH_MAX_LIMIT } from '@api/catalogLimits';
import { apiErrorMessage } from '@lib/apiErrorMessage';

import type { CatalogProductPayloadMetadata } from '../types';
import { buildCatalogProductMetadata } from '../lib/catalogProductMetadata';

interface UseCatalogProductsByIdsResult {
  products: CatalogProduct[] | null;
  metadata: CatalogProductPayloadMetadata | null;
  loading: boolean;
  error: string | null;
}

/**
 * Charge les produits catalogue associés à la boutique (catalogue complet).
 * L'accès invité est géré par le cookie httpOnly `ficheproduct_guest_session`.
 */
export function useCatalogProductsByIds(
  shop: Shop | null,
  enabled: boolean,
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
        const loadedProducts = await searchCatalogProducts({ limit: CATALOG_SEARCH_MAX_LIMIT });
        if (guard.cancelled) return;
        setProducts(loadedProducts);
        setMetadata(buildCatalogProductMetadata(loadedProducts));
      } catch (e) {
        if (guard.cancelled) return;
        setProducts(null);
        setMetadata(null);
        setError(apiErrorMessage(e, 'Erreur de chargement des produits catalogue.'));
      } finally {
        if (!guard.cancelled) setLoading(false);
      }
    })();

    return () => {
      guard.cancelled = true;
    };
  }, [enabled, shop]);

  return { products, metadata, loading, error };
}
