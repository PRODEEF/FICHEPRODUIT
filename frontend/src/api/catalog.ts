import type { CatalogProduct } from './types/api.types';
import { getApiBaseUrl } from './apiBase';
import { apiFetch, guestOrAuthHeaders, guestOrAuthHeadersNoBody } from './apiAuth';

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
  const detailedDescription =
    typeof o['detailedDescription'] === 'string' ? o['detailedDescription'] : '';
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
    detailedDescription,
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
 * Charge tous les produits catalogue dont la marque figure sur la boutique.
 * L'accès invité est géré par le cookie httpOnly `ficheproduct_guest_session`.
 */
export async function fetchCatalogProductsByShopBrands(shopId: string): Promise<CatalogProduct[]> {
  const { parsed } = await apiFetch(
    `${getApiBaseUrl()}/api/catalog/products/by-shop-brands/${encodeURIComponent(shopId)}`,
    {
      method: 'GET',
      headers: await guestOrAuthHeadersNoBody(),
    },
  );
  return parseCatalogProductArray(parsed);
}

export async function searchCatalogProducts(
  criteria: CatalogSearchCriteria,
): Promise<CatalogProduct[]> {
  const { parsed } = await apiFetch(`${getApiBaseUrl()}/api/catalog/products/search`, {
    method: 'POST',
    headers: await guestOrAuthHeaders(),
    body: JSON.stringify(criteria),
  });

  return parseCatalogProductArray(parsed);
}

/**
 * Récupère jusqu'à 50 noms de marques présentes dans le catalogue pour un secteur donné.
 */
export async function fetchBrandsBySector(sector: string): Promise<string[]> {
  const { parsed } = await apiFetch(
    `${getApiBaseUrl()}/api/catalog/products/brands-by-sector/${encodeURIComponent(sector)}`,
    {
      method: 'GET',
      headers: await guestOrAuthHeadersNoBody(),
    },
  );
  if (!Array.isArray(parsed)) {
    throw new Error('Réponse serveur invalide : liste de marques attendue.');
  }
  return (parsed as unknown[]).filter((item): item is string => typeof item === 'string');
}
