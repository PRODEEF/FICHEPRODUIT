import type { PatchMyShopBody, Shop } from '@types-api';

export type ShopCms = Shop['cms'];

export type { Shop };

export type UpdateShopPayload = PatchMyShopBody;
