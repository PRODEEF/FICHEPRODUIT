/**
 * Client API — magasin connecté (`/api/shop`).
 *
 * Routes NestJS :
 *   GET   /api/shop          (auth optionnelle — cookie invité + shopId query)
 *   PATCH /api/shop          (auth requise)
 */

import type { CmsType, PatchMyShopBody, Shop, ShopCategoryNode } from '@types-api';

import { getApiBaseUrl } from './apiBase';
import { apiFetch, ApiHttpError, authHeaders, guestOrAuthHeadersNoBody } from './apiAuth';
import { asRecord, readString, readStringArray } from './parseJsonFields';

// ---------------------------------------------------------------------------
// Normalisation JSON → Shop
// ---------------------------------------------------------------------------

function normalizeCms(raw: unknown): CmsType {
  if (raw === 'prestashop' || raw === 'shopify' || raw === 'woocommerce') {
    return raw;
  }
  if (raw === 'autre' || raw === 'other') return 'autre';
  if (raw === 'inconnu' || raw === 'unknown') return 'inconnu';
  return 'inconnu';
}

function normalizeCategoryNode(raw: unknown): ShopCategoryNode | null {
  const o = asRecord(raw);
  if (!o) return null;

  const id = readString(o, 'id')?.trim() ?? '';
  const name = readString(o, 'name')?.trim() ?? '';
  if (!id || !name) return null;

  const childrenRaw = Array.isArray(o['children']) ? o['children'] : [];
  const children = childrenRaw
    .map(normalizeCategoryNode)
    .filter((node): node is ShopCategoryNode => node !== null);

  return { id, name, children };
}

function normalizeCategoryTree(raw: unknown): ShopCategoryNode[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(normalizeCategoryNode).filter((node): node is ShopCategoryNode => node !== null);
}

/**
 * Normalise un objet brut venant du réseau en `Shop`
 * Retourne null si `id` ou `name` est manquant.
 */
export function normalizeShop(raw: unknown): Shop | null {
  const o = asRecord(raw);
  if (!o) return null;

  const id = readString(o, 'id');
  const name = readString(o, 'name');
  if (!id || !name) return null;

  const url = readString(o, 'url') ?? '';
  const sectorRaw = readString(o, 'sector')?.trim();
  const sector = sectorRaw && sectorRaw.length > 0 ? sectorRaw : 'Autres';

  const rawOwner = readString(o, 'ownerId');
  const ownerId = rawOwner?.trim() ? rawOwner : '';

  const createdAt = readString(o, 'createdAt') ?? new Date().toISOString();
  const updatedAt = readString(o, 'updatedAt') ?? createdAt;

  return {
    id,
    name,
    url,
    cms: normalizeCms(o['cms']),
    sector,
    brands: readStringArray(o['brands']),
    categoryTree: normalizeCategoryTree(o['categoryTree']),
    ownerId,
    createdAt,
    updatedAt,
  };
}

// ---------------------------------------------------------------------------
// API calls
// ---------------------------------------------------------------------------

/**
 * Récupère le magasin : compte connecté (`GET /api/shop`) ou invité avec `shopId` en query.
 * L'accès invité est assuré par le cookie httpOnly `ficheproduct_guest_session`.
 *
 * @param shopIdForGuest - Obligatoire sans JWT : UUID de la boutique (`analysis.shopId`).
 * @returns `null` si aucun magasin (404), sans lever d'erreur.
 * @throws {ApiHttpError} 401, 403, 500 ou réseau.
 */
export async function getMyShop(shopIdForGuest?: string): Promise<Shop | null> {
  const guestId = shopIdForGuest?.trim();
  const qs = guestId && guestId.length > 0 ? `?shopId=${encodeURIComponent(guestId)}` : '';

  try {
    const { parsed } = await apiFetch(`${getApiBaseUrl()}/api/shop${qs}`, {
      method: 'GET',
      headers: await guestOrAuthHeadersNoBody(),
    });
    return normalizeShop(parsed);
  } catch (err) {
    if (err instanceof ApiHttpError && err.status === 404) return null;
    throw err;
  }
}

/**
 * Met à jour le magasin (PATCH partiel).
 *
 * @throws {ApiHttpError} 400, 401, 404 ou réseau.
 */
export async function patchMyShop(body: PatchMyShopBody): Promise<Shop> {
  const payload: PatchMyShopBody = { ...body };
  if (payload.cms === 'other') payload.cms = 'autre';
  if (payload.cms === 'unknown') payload.cms = 'inconnu';

  const { parsed } = await apiFetch(`${getApiBaseUrl()}/api/shop`, {
    method: 'PATCH',
    headers: await authHeaders(),
    body: JSON.stringify(payload),
  });

  const shop = normalizeShop(parsed);
  if (!shop) {
    throw new Error('Réponse serveur invalide : shop attendu après mise à jour.');
  }
  return shop;
}
