/**
 * Client API — magasin connecté (`/api/shop`).
 */

import type { Shop, PatchMyShopBody, CmsType } from './types/api.types';
import { getApiBaseUrl } from './apiBase';
import { apiFetch, authHeaders, guestOrAuthHeadersNoBody, extractErrorMessage } from './apiAuth';

function normalizeCms(raw: unknown): CmsType {
  if (raw === 'prestashop' || raw === 'shopify' || raw === 'woocommerce') {
    return raw;
  }
  if (raw === 'autre' || raw === 'other') {
    return 'autre';
  }
  if (raw === 'inconnu' || raw === 'unknown') {
    return 'inconnu';
  }
  return 'inconnu';
}

export function normalizeShop(raw: unknown): Shop | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const o = raw as Record<string, unknown>;

  const id = typeof o['id'] === 'string' ? o['id'] : null;
  const name = typeof o['name'] === 'string' ? o['name'] : null;
  const url = typeof o['url'] === 'string' ? o['url'] : '';
  if (!id || !name) return null;

  const sector = typeof o['sector'] === 'string' && o['sector'].trim() ? o['sector'].trim() : null;
  const rawOwner =
    typeof o['ownerId'] === 'string'
      ? o['ownerId']
      : typeof o['owner_id'] === 'string'
        ? o['owner_id']
        : null;
  const ownerId = rawOwner?.trim() ? rawOwner : '';
  const createdAt =
    typeof o['createdAt'] === 'string'
      ? o['createdAt']
      : typeof o['created_at'] === 'string'
        ? o['created_at']
        : new Date().toISOString();
  const updatedAt =
    typeof o['updatedAt'] === 'string'
      ? o['updatedAt']
      : typeof o['updated_at'] === 'string'
        ? o['updated_at']
        : createdAt;

  const brands = Array.isArray(o['brands'])
    ? (o['brands'] as unknown[]).filter((x): x is string => typeof x === 'string')
    : [];
  const categories = Array.isArray(o['categories'])
    ? (o['categories'] as unknown[]).filter((x): x is string => typeof x === 'string')
    : [];

  return {
    id,
    name,
    url,
    cms: normalizeCms(o['cms']),
    sector,
    brands,
    categories,
    ownerId,
    createdAt,
    updatedAt,
  };
}

/**
 * Récupère le magasin : compte connecté (`GET /api/shop`) ou invité avec `shopId` en query.
 * L'accès invité est assuré par le cookie httpOnly `ficheproduct_guest_session`.
 *
 * @param shopIdForGuest - Obligatoire sans JWT : UUID de la boutique (`analysis.shopId`).
 * @returns `null` si aucun magasin (404), sans lever d'erreur.
 * @throws {Error} 401, 500 ou réseau.
 */
export async function getMyShop(shopIdForGuest?: string): Promise<Shop | null> {
  const base = getApiBaseUrl();
  const qs =
    shopIdForGuest && shopIdForGuest.trim().length > 0
      ? `?shopId=${encodeURIComponent(shopIdForGuest.trim())}`
      : '';
  const url = `${base}/api/shop${qs}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: await guestOrAuthHeadersNoBody(),
    credentials: 'include',
  });

  if (res.status === 404) {
    return null;
  }

  const text = await res.text();
  let parsed: unknown = null;
  if (text.length > 0) {
    try {
      parsed = JSON.parse(text);
    } catch {
      if (!res.ok) {
        throw new Error(`Réponse non-JSON du serveur (${res.status}).`);
      }
    }
  }

  if (!res.ok) {
    if (res.status === 401) {
      throw new Error('Session expirée ou non autorisée. Reconnecte-toi.');
    }
    if (res.status === 403) {
      throw new Error('Accès refusé.');
    }
    throw new Error(extractErrorMessage(parsed, `Erreur serveur (${res.status}).`));
  }

  return normalizeShop(parsed);
}

/**
 * Met à jour le magasin (PATCH partiel).
 *
 * @throws {Error} 400, 401, 404 ou réseau.
 */
export async function patchMyShop(body: PatchMyShopBody): Promise<Shop> {
  const payload: PatchMyShopBody = { ...body };
  if (payload.cms === 'other') payload.cms = 'autre';
  if (payload.cms === 'unknown') payload.cms = 'inconnu';

  const { parsed } = await apiFetch(`${getApiBaseUrl()}/api/shop`, {
    method: 'PATCH',
    headers: await authHeaders(),
    body: JSON.stringify(payload),
    credentials: 'include',
  });

  const shop = normalizeShop(parsed);
  if (!shop) {
    throw new Error('Réponse serveur invalide : shop attendu après mise à jour.');
  }
  return shop;
}
