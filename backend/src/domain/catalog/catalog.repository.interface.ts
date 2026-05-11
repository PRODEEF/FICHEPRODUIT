import type { CatalogProduct, CatalogSearchCriteria } from "./types/catalog.types";

export interface ICatalogRepository {
  findById(id: string): Promise<CatalogProduct | null>;
  findByIds(ids: string[]): Promise<CatalogProduct[]>;
  search(criteria: CatalogSearchCriteria): Promise<CatalogProduct[]>;
}

export const CATALOG_REPOSITORY = Symbol("ICatalogRepository");
export type { CatalogSearchCriteria };
