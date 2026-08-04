import type { Shop } from '../types';

let cachedUserId: string | null = null;
let cachedShop: Shop | null = null;

/** Magasin en cache pour l’utilisateur courant (persiste entre remontages de page). */
export function getShopCache(userId: string | undefined): Shop | null {
  if (!userId || userId !== cachedUserId) return null;
  return cachedShop;
}

export function setShopCache(userId: string, shop: Shop | null): void {
  cachedUserId = userId;
  cachedShop = shop;
}

export function clearShopCache(): void {
  cachedUserId = null;
  cachedShop = null;
}
