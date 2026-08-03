import type { CatalogProduct } from '@types-api';
import { catalogSectorsMatch } from '@shared/lib/shopSectors';

/**
 * Indique s’il faut passer le filtre secteur à « Tous » :
 * marque active, aucun résultat visible, mais des fiches de cette marque
 * existent uniquement hors du secteur courant.
 */
export function shouldRelaxSectorFilterForBrand(
  brand: string,
  sector: string,
  filteredCount: number,
  products: CatalogProduct[],
): boolean {
  const brandTrimmed = brand.trim();
  const sectorTrimmed = sector.trim();
  if (!brandTrimmed || !sectorTrimmed) return false;
  if (filteredCount > 0) return false;

  const brandLower = brandTrimmed.toLowerCase();
  const brandProducts = products.filter((p) => p.brand.toLowerCase() === brandLower);
  if (brandProducts.length === 0) return false;

  return !brandProducts.some((p) => catalogSectorsMatch(p.sector, sectorTrimmed));
}
