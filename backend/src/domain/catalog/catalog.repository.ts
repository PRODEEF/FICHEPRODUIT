import { Injectable, InternalServerErrorException, Logger } from "@nestjs/common";
import { SupabaseService } from "../../core/supabase/supabase.service";
import type { Database, Json } from "../../core/supabase/database.types";
import type { ICatalogRepository } from "./catalog.repository.interface";
import type { CatalogProduct, CatalogSearchCriteria } from "./types/catalog.types";

type CatalogProductRow = Database["public"]["Tables"]["catalog_products"]["Row"];

/**
 * Reads on `catalog_products` (RLS applies).
 */
@Injectable()
export class CatalogRepository implements ICatalogRepository {
  private readonly logger = new Logger(CatalogRepository.name);
  private static readonly DEFAULT_LIMIT = 500;
  private static readonly MAX_LIMIT = 1000;

  constructor(private readonly supabase: SupabaseService) {}

  async findById(id: string): Promise<CatalogProduct | null> {
    const { data, error } = await this.supabase.anon
      .from("catalog_products")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      this.logger.error(`findById(${id}) failed`, error);
      throw new InternalServerErrorException("Failed to fetch catalog product");
    }

    return data ? this.toEntity(data as CatalogProductRow) : null;
  }

  async findByIds(ids: string[]): Promise<CatalogProduct[]> {
    if (ids.length === 0) return [];

    const uniqueIds = [...new Set(ids)];
    const { data, error } = await this.supabase.anon
      .from("catalog_products")
      .select("*")
      .in("id", uniqueIds);

    if (error) {
      this.logger.error(`findByIds(${uniqueIds.length} ids) failed`, error);
      throw new InternalServerErrorException("Failed to fetch catalog products");
    }

    const rows = (data ?? []) as CatalogProductRow[];
    const byId = new Map(rows.map((row) => [row.id, this.toEntity(row)] as const));

    return ids.map((id) => byId.get(id)).filter((p): p is CatalogProduct => p !== undefined);
  }

  async search(criteria: CatalogSearchCriteria): Promise<CatalogProduct[]> {
    const limit = this.sanitizeLimit(criteria.limit);
    const brands = this.normalizeTextArray(criteria.brands);

    if (brands.length > 0) {
      this.logger.log(
        `[catalog.search] merged-by-brand path brands=${JSON.stringify(brands)} limit=${limit} otherCriteria=${JSON.stringify({
          sector: criteria.sector,
          categories: criteria.categories,
          subcategories: criteria.subcategories,
          minYear: criteria.minYear,
          maxYear: criteria.maxYear,
          minPrice: criteria.minPrice,
          maxPrice: criteria.maxPrice,
          attributes: criteria.attributes,
        })}`,
      );
      return this.searchMergedByBrandIlike(brands, criteria, limit);
    }

    let query = this.supabase.anon.from("catalog_products").select("*");
    query = this.chainBrandlessFilters(query, criteria);
    const { data, error } = await query.limit(limit);
    if (error) {
      this.logger.error("search(criteria) failed", error);
      throw new InternalServerErrorException("Failed to search catalog products");
    }

    return ((data ?? []) as CatalogProductRow[]).map((row) => this.toEntity(row));
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
    const { count: totalCatalogCount, error: countError } = await this.supabase.anon
      .from("catalog_products")
      .select("*", { count: "exact", head: true });

    this.logger.log(
      `[catalog.search.brands] table=catalog_products headCount=${totalCatalogCount ?? "null"} countError=${countError ? this.formatSupabaseError(countError) : "none"}`,
    );

    const { data: probeRows, error: probeError } = await this.supabase.anon
      .from("catalog_products")
      .select("id, brand")
      .limit(1);
    this.logger.log(
      `[catalog.search.brands] probe select id,brand limit=1 error=${probeError ? this.formatSupabaseError(probeError) : "none"} rows=${JSON.stringify(probeRows ?? [])}`,
    );

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
        throw new InternalServerErrorException("Failed to search catalog products");
      }

      const rows = (data ?? []) as CatalogProductRow[];
      for (const row of rows) {
        if (!byId.has(row.id)) byId.set(row.id, row);
      }
      this.logger.log(
        `[catalog.search.brands] brand=${JSON.stringify(brand)} ilikePattern=${JSON.stringify(ilikePattern)} rowCount=${rows.length} mergedUniqueAfter=${byId.size}`,
      );
      if (rows.length > 0 && rows.length <= 3) {
        this.logger.log(
          `[catalog.search.brands] sample ids/brands: ${JSON.stringify(rows.map((r) => ({ id: r.id, brand: r.brand })))}`,
        );
      }
    }

    this.logger.log(`[catalog.search.brands] done mergedUnique=${byId.size} returningSlice=${Math.min(byId.size, limit)}`);

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

  private normalizeAttributes(attributes: Record<string, string> | undefined): Record<string, string> {
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

  private formatSupabaseError(error: { message?: string; details?: string; hint?: string; code?: string }): string {
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
      images: row.images ?? [],
      url: row.url,
      attributes: this.attributesFromJson(row.attributes),
    };
  }
}
