import type { CatalogProduct } from './types/api.types';
import { getApiBaseUrl } from './apiBase';
import { apiFetch, guestOrAuthHeaders, guestOrAuthHeadersNoBodyWithGuestSession } from './apiAuth';

export interface CatalogSearchCriteria {
  sector?: string;
  brands?: string[];
  categories?: string[];
  subcategories?: string[];
  minYear?: number;
  maxYear?: number;
  minPrice?: number;
  maxPrice?: number;
  attributes?: Record<string, string>;
  limit?: number;
}

function normalizeCatalogProduct(raw: unknown): CatalogProduct | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const o = raw as Record<string, unknown>;
  const id = typeof o['id'] === 'string' ? o['id'] : null;
  const name = typeof o['name'] === 'string' ? o['name'] : null;
  const brand = typeof o['brand'] === 'string' ? o['brand'] : null;
  const sector = typeof o['sector'] === 'string' ? o['sector'] : null;
  const category = typeof o['category'] === 'string' ? o['category'] : null;
  if (!id || !name || !brand || !sector || !category) return null;

  const subCategory = typeof o['subCategory'] === 'string' ? o['subCategory'] : null;
  const year = typeof o['year'] === 'number' ? o['year'] : 0;
  const price = typeof o['price'] === 'number' ? o['price'] : 0;
  const description = typeof o['description'] === 'string' ? o['description'] : '';
  const images = Array.isArray(o['images'])
    ? (o['images'] as unknown[]).filter((x): x is string => typeof x === 'string')
    : [];
  const url = typeof o['url'] === 'string' ? o['url'] : '';
  const attributes =
    typeof o['attributes'] === 'object' && o['attributes'] !== null
      ? Object.fromEntries(
          Object.entries(o['attributes'] as Record<string, unknown>).filter(
            (entry): entry is [string, string] => typeof entry[1] === 'string',
          ),
        )
      : {};

  return {
    id,
    name,
    brand,
    sector,
    category,
    subCategory,
    year,
    price,
    description,
    images,
    url,
    attributes,
  };
}

function parseCatalogProductArray(parsed: unknown): CatalogProduct[] {
  if (!Array.isArray(parsed)) {
    throw new Error('Réponse serveur invalide : liste de produits attendue.');
  }
  const out: CatalogProduct[] = [];
  for (const item of parsed) {
    const product = normalizeCatalogProduct(item);
    if (product) out.push(product);
  }
  return out;
}

/**
 * Loads all catalog products whose brand is listed on the shop (JWT required).
 */
export async function fetchCatalogProductsByShopBrands(
  shopId: string,
  guestSessionId?: string | null,
): Promise<CatalogProduct[]> {
  const { parsed } = await apiFetch(
    `${getApiBaseUrl()}/api/catalog/products/by-shop-brands/${encodeURIComponent(shopId)}`,
    {
      method: 'GET',
      headers: await guestOrAuthHeadersNoBodyWithGuestSession(guestSessionId),
    },
  );
  return parseCatalogProductArray(parsed);
}

export async function searchCatalogProducts(criteria: CatalogSearchCriteria): Promise<CatalogProduct[]> {
  const { parsed } = await apiFetch(
    `${getApiBaseUrl()}/api/catalog/products/search`,
    {
      method: 'POST',
      headers: await guestOrAuthHeaders(),
      body: JSON.stringify(criteria),
    },
  );

  return parseCatalogProductArray(parsed);
}
