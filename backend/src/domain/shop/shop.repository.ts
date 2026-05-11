import { Injectable, InternalServerErrorException, Logger } from "@nestjs/common";
import { SupabaseService } from "../../core/supabase/supabase.service";
import type { Database } from "../../core/supabase/database.types";
import type { IShopRepository } from "./shop.repository.interface";
import type { CreateShop, Shop, UpdateShop, UpsertShopFromAnalysis } from "./types/shop.types";

type ShopRow = Database["public"]["Tables"]["shops"]["Row"];

@Injectable()
export class ShopRepository implements IShopRepository {
  private readonly logger = new Logger(ShopRepository.name);

  constructor(private readonly supabase: SupabaseService) {}

  async findById(id: string, accessToken: string): Promise<Shop | null> {
    const { data, error } = await this.supabase
      .forUser(accessToken)
      .from("shops")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      this.logger.error(`findById(${id}) failed`, error);
      throw new InternalServerErrorException("Failed to fetch shop");
    }
    return data ? this.toEntity(data as ShopRow) : null;
  }

  async findByIdForGuest(id: string, sessionId: string): Promise<Shop | null> {
    const { data, error } = await this.supabase.admin
      .from("shops")
      .select("*")
      .eq("id", id)
      .eq("session_id", sessionId)
      .maybeSingle();

    if (error) {
      this.logger.error(`findByIdForGuest(${id}) failed`, error);
      throw new InternalServerErrorException("Failed to fetch shop");
    }
    return data ? this.toEntity(data as ShopRow) : null;
  }

  async findAllByOwner(ownerId: string, accessToken: string): Promise<Shop[]> {
    const { data, error } = await this.supabase
      .forUser(accessToken)
      .from("shops")
      .select("*")
      .eq("user_id", ownerId)
      .order("created_at", { ascending: false });

    if (error) {
      this.logger.error(`findAllByOwner(${ownerId}) failed`, error);
      throw new InternalServerErrorException("Failed to fetch shops");
    }
    return (data ?? []).map((row) => this.toEntity(row as ShopRow));
  }

  async create(data: CreateShop, accessToken: string): Promise<Shop> {
    if (!data.ownerId) {
      this.logger.error("create: ownerId manquant");
      throw new InternalServerErrorException("Missing ownerId for shop creation");
    }

    const { data: row, error } = await this.supabase
      .forUser(accessToken)
      .from("shops")
      .insert({
        name: data.name,
        url: data.url,
        cms: data.cms,
        sector: data.sector,
        brands: data.brands,
        categories: data.categories,
        user_id: data.ownerId,
        session_id: null,
      })
      .select()
      .single();

    if (error) {
      this.logger.error("create failed", error);
      throw new InternalServerErrorException("Failed to create shop");
    }
    return this.toEntity(row as ShopRow);
  }

  async update(id: string, data: UpdateShop, accessToken: string): Promise<Shop> {
    const { data: row, error } = await this.supabase
      .forUser(accessToken)
      .from("shops")
      .update(this.toRow(data))
      .eq("id", id)
      .select()
      .single();

    if (error) {
      this.logger.error(`update(${id}) failed`, error);
      throw new InternalServerErrorException("Failed to update shop");
    }
    return this.toEntity(row as ShopRow);
  }

  async upsertFromAnalysis(data: UpsertShopFromAnalysis, accessToken: string): Promise<Shop> {
    const isUserFlow = Boolean(data.ownerId);
    const client = isUserFlow ? this.supabase.forUser(accessToken) : this.supabase.admin;

    if (isUserFlow && !accessToken) {
      this.logger.error("upsertFromAnalysis: token manquant pour user flow");
      throw new InternalServerErrorException("Missing token for shop upsert");
    }

    if (!data.ownerId && !data.sessionId) {
      this.logger.error("upsertFromAnalysis: ownerId/sessionId manquants");
      throw new InternalServerErrorException("Missing ownerId or sessionId for shop upsert");
    }

    const existingQuery = client.from("shops").select("*").eq("url", data.url);
    const existing = isUserFlow
      ? await existingQuery.eq("user_id", data.ownerId as string).maybeSingle()
      : await existingQuery.eq("session_id", data.sessionId as string).maybeSingle();

    if (existing.error) {
      this.logger.error(
        `upsertFromAnalysis find failed (${isUserFlow ? data.ownerId : data.sessionId})`,
        existing.error,
      );
      throw new InternalServerErrorException("Failed to fetch shop");
    }

    const prev = existing.data as ShopRow | null;

    if (prev) {
      const { data: updated, error } = await client
        .from("shops")
        .update({
          name: data.name,
          cms: data.cms,
          sector: data.sector,
          brands: data.brands,
          categories: data.categories,
        })
        .eq("id", prev.id)
        .select()
        .single();

      if (error) {
        this.logger.error(`upsertFromAnalysis update(${prev.id}) failed`, error);
        throw new InternalServerErrorException("Failed to update shop");
      }
      return this.toEntity(updated as ShopRow);
    }

    const { data: inserted, error } = await client
      .from("shops")
      .insert({
        name: data.name,
        url: data.url,
        cms: data.cms,
        sector: data.sector,
        brands: data.brands,
        categories: data.categories,
        user_id: data.ownerId,
        session_id: data.sessionId,
      })
      .select()
      .single();

    if (error) {
      this.logger.error("upsertFromAnalysis insert failed", error);
      throw new InternalServerErrorException("Failed to create shop");
    }
    return this.toEntity(inserted as ShopRow);
  }

  async transferToUser(sessionId: string, userId: string): Promise<void> {
    const { error } = await this.supabase.admin
      .from("shops")
      .update({
        user_id: userId,
        session_id: null,
      })
      .eq("session_id", sessionId);

    if (error) {
      this.logger.error(`transferToUser(${sessionId}) failed`, error);
      throw new InternalServerErrorException("Failed to transfer guest shops");
    }
  }

  async purgeGuestDataOlderThan(hours: number): Promise<number> {
    const cutoffIso = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
    const { data, error } = await this.supabase.admin
      .from("shops")
      .delete()
      .is("user_id", null)
      .not("session_id", "is", null)
      .lt("created_at", cutoffIso)
      .select("id");

    if (error) {
      this.logger.error(`purgeGuestDataOlderThan(${hours}) failed`, error);
      throw new InternalServerErrorException("Failed to purge guest shops");
    }

    return data?.length ?? 0;
  }

  private toRow(data: UpdateShop): Database["public"]["Tables"]["shops"]["Update"] {
    return {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.url !== undefined ? { url: data.url } : {}),
      ...(data.cms !== undefined ? { cms: data.cms } : {}),
      ...(data.sector !== undefined ? { sector: data.sector } : {}),
      ...(data.brands !== undefined ? { brands: data.brands } : {}),
      ...(data.categories !== undefined ? { categories: data.categories } : {}),
    };
  }

  private toEntity(row: ShopRow): Shop {
    return {
      id: row.id,
      name: row.name,
      url: row.url,
      cms: row.cms,
      sector: row.sector,
      brands: row.brands ?? [],
      categories: row.categories ?? [],
      ownerId: row.user_id,
      sessionId: row.session_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
