import { Injectable, InternalServerErrorException, Logger } from "@nestjs/common";
import { SupabaseService } from "../../core/supabase/supabase.service";
import type { Database, Json } from "../../core/supabase/database.types";
import { CATALOG_SEARCH_MAX_LIMIT } from "./catalog.constants";
import type { ICatalogRepository } from "./catalog.repository.interface";
import type { CatalogProduct, CatalogSearchCriteria } from "./types/catalog.types";

type CatalogProductRow = Database["public"]["Tables"]["catalog_products"]["Row"];

/**
 * Taille max d’un lot `.in("id", …)` PostgREST.
 * Au-delà (~200+ UUID), l’URL dépasse la limite headers Supabase (~16 KB).
 */
export const CATALOG_FIND_BY_IDS_BATCH_SIZE = 100;

/**
 * Reads on `catalog_products` (RLS applies).
 */
@Injectable()
export class CatalogRepository implements ICatalogRepository {
  private readonly logger = new Logger(CatalogRepository.name);
  private static readonly DEFAULT_LIMIT = CATALOG_SEARCH_MAX_LIMIT;
  private static readonly MAX_LIMIT = CATALOG_SEARCH_MAX_LIMIT;

  constructor(private readonly supabase: SupabaseService) {}

  async findById(id: string): Promise<CatalogProduct | null> {
    const { data, error } = await this.supabase.anon
      .from("catalog_products")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      this.logger.error(`findById(${id}) failed`, error);
      throw new InternalServerErrorException("Échec de la récupération du produit catalogue");
    }

    return data ? this.toEntity(data as CatalogProductRow) : null;
  }

  async findByIds(ids: string[]): Promise<CatalogProduct[]> {
    if (ids.length === 0) return [];

    const uniqueIds = [...new Set(ids)];
    const byId = new Map<string, CatalogProduct>();
    let batchCount = 0;

    for (let offset = 0; offset < uniqueIds.length; offset += CATALOG_FIND_BY_IDS_BATCH_SIZE) {
      const batch = uniqueIds.slice(offset, offset + CATALOG_FIND_BY_IDS_BATCH_SIZE);
      batchCount += 1;

      const { data, error } = await this.supabase.anon
        .from("catalog_products")
        .select("*")
        .in("id", batch);

      if (error) {
        this.logger.error(
          `findByIds batch ${batchCount} (${batch.length} ids, offset ${offset}/${uniqueIds.length}) failed`,
          error,
        );
        throw new InternalServerErrorException("Échec de la récupération des produits catalogue");
      }

      for (const row of (data ?? []) as CatalogProductRow[]) {
        byId.set(row.id, this.toEntity(row));
      }
    }

    return ids.map((id) => byId.get(id)).filter((p): p is CatalogProduct => p !== undefined);
  }

  async search(criteria: CatalogSearchCriteria): Promise<CatalogProduct[]> {
    const limit = this.sanitizeLimit(criteria.limit);
    const brands = this.normalizeTextArray(criteria.brands);

    if (brands.length > 0) {
      return this.searchMergedByBrandIlike(brands, criteria, limit);
    }

    let query = this.supabase.anon.from("catalog_products").select("*");
    query = this.chainBrandlessFilters(query, criteria);
    const { data, error } = await query.limit(limit);
    if (error) {
      this.logger.error("search(criteria) failed", error);
      throw new InternalServerErrorException("Échec de la recherche produits catalogue");
    }

    return ((data ?? []) as CatalogProductRow[]).map((row) => this.toEntity(row));
  }

  /**
   * Retourne les marques distinctes d’un secteur (dédoublonnage insensible à la casse).
   */
  async listDistinctBrandsBySector(sector: string, limit: number): Promise<string[]> {
    const normalizedSector = this.normalizeText(sector);
    if (!normalizedSector) return [];

    const fetchLimit = Math.max(1, Math.min(CatalogRepository.MAX_LIMIT, Math.trunc(limit) * 20));
    const { data, error } = await this.supabase.anon
      .from("catalog_products")
      .select("brand")
      .eq("sector", normalizedSector)
      .limit(fetchLimit);

    if (error) {
      this.logger.error(`listDistinctBrandsBySector(${normalizedSector}) failed`, error);
      throw new InternalServerErrorException("Échec de la récupération des marques par secteur");
    }

    const byLower = new Map<string, string>();
    for (const row of (data ?? []) as Pick<CatalogProductRow, "brand">[]) {
      const brand = typeof row.brand === "string" ? row.brand.trim() : "";
      if (!brand) continue;
      const key = brand.toLowerCase();
      if (!byLower.has(key)) byLower.set(key, brand);
    }

    return [...byLower.values()]
      .sort((a, b) => a.localeCompare(b, "fr", { sensitivity: "base" }))
      .slice(0, Math.max(1, Math.min(CatalogRepository.MAX_LIMIT, Math.trunc(limit))));
  }

  /**
   * Applies sector, category, price, etc. — everything except the `brands` array
   * (brand matching is done separately via `.ilike` per brand for case-insensitive exact match).
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase query builder chain
  private chainBrandlessFilters(query: any, criteria: CatalogSearchCriteria): any {
    const sector = this.normalizeText(criteria.sector);
    if (sector) query = query.eq("sector", sector);

    const categories = this.normalizeTextArray(criteria.categories);
    if (categories.length > 0) query = query.in("category", categories);

    const subcategories = this.normalizeTextArray(criteria.subcategories);
    if (subcategories.length > 0) query = query.in("sub_category", subcategories);

    if (Number.isFinite(criteria.minYear)) query = query.gte("year", criteria.minYear as number);
    if (Number.isFinite(criteria.maxYear)) query = query.lte("year", criteria.maxYear as number);
    if (Number.isFinite(criteria.minPrice)) query = query.gte("price", criteria.minPrice as number);
    if (Number.isFinite(criteria.maxPrice)) query = query.lte("price", criteria.maxPrice as number);

    const attributes = this.normalizeAttributes(criteria.attributes);
    for (const [key, value] of Object.entries(attributes)) {
      query = query.contains("attributes", { [key]: value });
    }

    return query;
  }

  /**
   * One `.ilike` query per shop brand (PostgREST `or` + `ilike` was returning no rows in practice),
   * then merge rows by `id` and cap to `limit`.
   */
  private async searchMergedByBrandIlike(
    brands: string[],
    criteria: CatalogSearchCriteria,
    limit: number,
  ): Promise<CatalogProduct[]> {
    const byId = new Map<string, CatalogProductRow>();

    for (const brand of brands) {
      const ilikePattern = this.escapeForLike(brand);
      let query = this.supabase.anon.from("catalog_products").select("*");
      query = this.chainBrandlessFilters(query, criteria);
      query = query.ilike("brand", ilikePattern);
      query = query.limit(limit);

      const { data, error } = await query;
      if (error) {
        this.logger.error(
          `[catalog.search.brands] brand=${JSON.stringify(brand)} ilikePattern=${JSON.stringify(ilikePattern)} ${this.formatSupabaseError(error)}`,
        );
        throw new InternalServerErrorException("Échec de la recherche produits catalogue");
      }

      const rows = (data ?? []) as CatalogProductRow[];
      for (const row of rows) {
        if (!byId.has(row.id)) byId.set(row.id, row);
      }
    }

    return [...byId.values()].slice(0, limit).map((row) => this.toEntity(row));
  }

  private attributesFromJson(json: Json | null): Record<string, string> {
    if (json === null || typeof json !== "object" || Array.isArray(json)) {
      return {};
    }
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(json)) {
      if (v !== null && v !== undefined) out[k] = String(v);
    }
    return out;
  }

  private normalizeText(value: string | undefined): string | null {
    if (typeof value !== "string") return null;
    const normalized = value.trim();
    return normalized.length > 0 ? normalized : null;
  }

  private normalizeTextArray(values: string[] | undefined): string[] {
    if (!Array.isArray(values)) return [];
    const out = values
      .map((value) => this.normalizeText(value))
      .filter((value): value is string => value !== null);
    return [...new Set(out)];
  }

  private normalizeAttributes(
    attributes: Record<string, string> | undefined,
  ): Record<string, string> {
    if (!attributes || typeof attributes !== "object" || Array.isArray(attributes)) {
      return {};
    }
    const out: Record<string, string> = {};
    for (const [key, value] of Object.entries(attributes)) {
      const normalizedKey = this.normalizeText(key);
      const normalizedValue = this.normalizeText(value);
      if (!normalizedKey || !normalizedValue) continue;
      out[normalizedKey] = normalizedValue;
    }
    return out;
  }

  private sanitizeLimit(limit: number | undefined): number {
    if (!Number.isFinite(limit)) return CatalogRepository.DEFAULT_LIMIT;
    return Math.max(1, Math.min(CatalogRepository.MAX_LIMIT, Math.trunc(limit as number)));
  }

  private escapeForLike(value: string): string {
    return value.replace(/[%_]/g, "\\$&");
  }

  private formatSupabaseError(error: {
    message?: string;
    details?: string;
    hint?: string;
    code?: string;
  }): string {
    return JSON.stringify({
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });
  }

  private toEntity(row: CatalogProductRow): CatalogProduct {
    return {
      id: row.id,
      name: row.name,
      brand: row.brand,
      sector: row.sector,
      category: row.category,
      subCategory: row.sub_category,
      year: row.year ?? 0,
      price: row.price,
      description: row.description ?? "",
      detailedDescription: row.detailed_description ?? "",
      images: row.images ?? [],
      url: row.url,
      attributes: this.attributesFromJson(row.attributes),
    };
  }
}
