import type { CatalogProduct, CatalogSearchCriteria } from "./types/catalog.types";

export interface ICatalogRepository {
  findById(id: string): Promise<CatalogProduct | null>;
  findByIds(ids: string[]): Promise<CatalogProduct[]>;
  search(criteria: CatalogSearchCriteria): Promise<CatalogProduct[]>;
  /** Marques distinctes pour un secteur, triées alphabétiquement. */
  listDistinctBrandsBySector(sector: string, limit: number): Promise<string[]>;
}

export const CATALOG_REPOSITORY = Symbol("ICatalogRepository");
export type { CatalogSearchCriteria };
