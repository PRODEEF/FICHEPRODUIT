/** Labels secteur boutique — alignés sur backend `shop-sector.schema.ts`. */
export const SHOP_SECTOR_LABELS = [
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
  'Autres',
] as const;

export type ShopSectorLabel = (typeof SHOP_SECTOR_LABELS)[number];

export function isShopSectorLabel(value: string): value is ShopSectorLabel {
  return (SHOP_SECTOR_LABELS as readonly string[]).includes(value);
}
