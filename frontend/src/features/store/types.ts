import type { PatchMyShopBody, Shop } from '@types-api';

export type ShopCms = Shop['cms'];

export type { Shop };

export type UpdateShopPayload = PatchMyShopBody;

export const ShopSector: string[] = [
  'Nautisme',
  'Glisse',
  'Vélo',
  'Outdoor',
  'Montagne',
  'Mode',
  'Maison',
  'Animalerie',
  'Sport',
  'Jardin',
  'Bricolage',
  'Puériculture',
  'Bijoux',
  'Montres',
  'Gastronomie',
  'Gaming',
  'Autre',
];
