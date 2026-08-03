import type { CatalogProduct } from '@types-api';

import type { CatalogProductPayloadMetadata } from '../types';

/** Entrée du cache produits catalogue (stale-while-revalidate). */
export interface CatalogProductsCacheEntry {
  products: CatalogProduct[];
  metadata: CatalogProductPayloadMetadata;
}

const cache = new Map<string, CatalogProductsCacheEntry>();
let lastCacheKey: string | null = null;

/** Clé de cache : id magasin (ou recherche large) + signature des marques. */
export function buildCatalogProductsCacheKey(
  shopId: string | null | undefined,
  brandsSignature: string,
): string {
  return `${shopId ?? 'search'}\u0001${brandsSignature}`;
}

export function getCatalogProductsCache(key: string): CatalogProductsCacheEntry | null {
  return cache.get(key) ?? null;
}

/** Dernière entrée réussie — utile au remount avant que le shop soit rechargé. */
export function getLastCatalogProductsCache(): CatalogProductsCacheEntry | null {
  if (lastCacheKey === null) return null;
  return cache.get(lastCacheKey) ?? null;
}

export function setCatalogProductsCache(key: string, entry: CatalogProductsCacheEntry): void {
  cache.set(key, entry);
  lastCacheKey = key;
}
