/**
 * Client API — Catalogue produits
 *
 * Routes NestJS :
 *   GET  /api/catalog/products/by-shop-brands/:shopId
 *   POST /api/catalog/products/search
 *   GET  /api/catalog/products/brands-by-sector/:sector
 */

import type { CatalogProduct } from '@types-api';

import { getApiBaseUrl } from './apiBase';
import { apiFetch, guestOrAuthHeaders, guestOrAuthHeadersNoBody } from './apiAuth';
import {
  asRecord,
  readNumber,
  readString,
  readStringArray,
  readStringRecord,
} from './parseJsonFields';

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

/**
 * Normalise un produit catalogue (contrat Nest — `CatalogProductResponseDto`).
 */
function normalizeCatalogProduct(raw: unknown): CatalogProduct | null {
  const o = asRecord(raw);
  if (!o) return null;

  const id = readString(o, 'id');
  const name = readString(o, 'name');
  const brand = readString(o, 'brand');
  const sector = readString(o, 'sector');
  const category = readString(o, 'category');
  if (!id || !name || !brand || !sector || !category) return null;

  return {
    id,
    name,
    brand,
    sector,
    category,
    subCategory: readString(o, 'subCategory'),
    year: readNumber(o, 'year') ?? 0,
    price: readNumber(o, 'price') ?? 0,
    description: readString(o, 'description') ?? '',
    detailedDescription: readString(o, 'detailedDescription') ?? '',
    images: readStringArray(o['images']),
    url: readString(o, 'url') ?? '',
    attributes: readStringRecord(o['attributes']),
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
  return readStringArray(parsed);
}
