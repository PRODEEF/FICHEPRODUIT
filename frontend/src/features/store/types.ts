import type { PatchMyShopBody, Shop } from '@types-api';

export type ShopCms = Shop['cms'];

export type { Shop };

export type UpdateShopPayload = PatchMyShopBody;

export type { ShopSectorLabel } from '@shared/lib/shopSectors';

export { SHOP_SECTOR_LABELS, isShopSectorLabel } from '@shared/lib/shopSectors';
