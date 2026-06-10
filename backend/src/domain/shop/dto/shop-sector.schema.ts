import { z } from "zod";

/** Labels secteur boutique — alignés sur frontend `shared/lib/shopSectors.ts`. */
export const SHOP_SECTOR_VALUES = [
  "Nautisme",
  "Glisse",
  "Vélo",
  "Outdoor",
  "Montagne",
  "Mode",
  "Maison",
  "Animalerie",
  "Sport",
  "Jardin",
  "Bricolage",
  "Puériculture",
  "Bijoux",
  "Montres",
  "Gastronomie",
  "Gaming",
  "Autres",
] as const;

export type ShopSector = (typeof SHOP_SECTOR_VALUES)[number];

export const shopSectorSchema = z.enum(SHOP_SECTOR_VALUES);

export function isShopSector(value: string): value is ShopSector {
  return (SHOP_SECTOR_VALUES as readonly string[]).includes(value);
}

/** Retourne le label canonique ou `null` si la valeur n’est pas dans la liste. */
export function normalizeShopSector(value: string | null | undefined): ShopSector | null {
  if (value == null) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return isShopSector(trimmed) ? trimmed : null;
}
