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

/**
 * Normalise une valeur secteur catalogue vers un label canonique quand possible.
 * Trim + match insensible à la casse sur `SHOP_SECTOR_LABELS`.
 * Sinon retourne la valeur trimée (comparaison possible entre valeurs brutes).
 */
export function normalizeCatalogSector(value: string | null | undefined): string {
  const trimmed = value?.trim() ?? '';
  if (!trimmed) return '';

  const lower = trimmed.toLowerCase();
  const canonical = SHOP_SECTOR_LABELS.find((label) => label.toLowerCase() === lower);
  if (canonical) return canonical;

  return trimmed;
}

/** Compare deux secteurs après normalisation (insensible à la casse). */
export function catalogSectorsMatch(
  productSector: string | null | undefined,
  filterSector: string | null | undefined,
): boolean {
  const filter = normalizeCatalogSector(filterSector);
  if (!filter) return true;
  return normalizeCatalogSector(productSector).toLowerCase() === filter.toLowerCase();
}
