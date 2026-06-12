import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from "@nestjs/common";
import { SupabaseService } from "../../core/supabase/supabase.service";
import type { Database, Json } from "../../core/supabase/database.types";
import type { IProductTemplateRepository } from "./product-template.repository.interface";
import type {
  ProductTemplate,
  ProductTemplateField,
  CreateProductTemplate,
  UpdateProductTemplate,
} from "./types/product-template.types";

type ProductTemplatesUpdate = Database["public"]["Tables"]["product_templates"]["Update"];

type ProductTemplateRowDb = {
  id: string;
  name: string;
  shop_id: string;
  user_id: string;
  fields: Json;
  created_at: string;
  updated_at: string;
};

@Injectable()
export class ProductTemplateRepository implements IProductTemplateRepository {
  private readonly logger = new Logger(ProductTemplateRepository.name);

  constructor(private readonly supabase: SupabaseService) {}

  async findById(id: string, accessToken: string): Promise<ProductTemplate | null> {
    const { data, error } = await this.supabase
      .forUser(accessToken)
      .from("product_templates")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      this.logger.error(`findById(${id}) failed`, error);
      throw new InternalServerErrorException("Échec de la récupération du gabarit");
    }
    return data ? this.toEntity(data as unknown as ProductTemplateRowDb) : null;
  }

  async existsByNameInShop(
    shopId: string,
    name: string,
    accessToken: string,
    excludeId?: string,
  ): Promise<boolean> {
    const normalized = name.trim().toLowerCase();
    const { data, error } = await this.supabase
      .forUser(accessToken)
      .from("product_templates")
      .select("id, name")
      .eq("shop_id", shopId);

    if (error) {
      this.logger.error(`existsByNameInShop(${shopId}) failed`, error);
      throw new InternalServerErrorException("Échec de la vérification du nom de gabarit");
    }

    return (data ?? []).some((row) => {
      if (excludeId && row.id === excludeId) return false;
      const rowName = typeof row.name === "string" ? row.name.trim().toLowerCase() : "";
      return rowName === normalized;
    });
  }

  async findAllByShop(shopId: string, accessToken: string): Promise<ProductTemplate[]> {
    const { data, error } = await this.supabase
      .forUser(accessToken)
      .from("product_templates")
      .select("*")
      .eq("shop_id", shopId)
      .order("created_at", { ascending: false });

    if (error) {
      this.logger.error(`findAllByShop(${shopId}) failed`, error);
      throw new InternalServerErrorException("Échec de la récupération des gabarits");
    }
    return (data ?? []).map((r) => this.toEntity(r as unknown as ProductTemplateRowDb));
  }

  async create(
    data: CreateProductTemplate,
    accessToken: string,
    userId: string,
  ): Promise<ProductTemplate> {
    const { data: row, error } = await this.supabase
      .forUser(accessToken)
      .from("product_templates")
      .insert(this.toRow(data, userId))
      .select()
      .single();

    if (error) {
      this.logger.error("create failed", error);
      if (error.code === "23505") {
        throw new ConflictException("Une fiche avec ce nom existe déjà.");
      }
      throw new InternalServerErrorException("Échec de la création du gabarit");
    }
    return this.toEntity(row as unknown as ProductTemplateRowDb);
  }

  async update(
    id: string,
    patch: UpdateProductTemplate,
    accessToken: string,
  ): Promise<ProductTemplate> {
    const patchRow: ProductTemplatesUpdate = {
      updated_at: new Date().toISOString(),
      ...(patch.name !== undefined ? { name: patch.name } : {}),
      ...(patch.fields !== undefined
        ? {
            fields: patch.fields.map((f, i) => ({
              ...f,
              order: i,
            })) as Json,
          }
        : {}),
    };

    const { data: row, error } = await this.supabase
      .forUser(accessToken)
      .from("product_templates")
      .update(patchRow)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      this.logger.error(`update(${id}) failed`, error);
      if (error.code === "23505") {
        throw new ConflictException("Une fiche avec ce nom existe déjà.");
      }
      throw new InternalServerErrorException("Échec de la mise à jour du gabarit");
    }
    return this.toEntity(row as unknown as ProductTemplateRowDb);
  }

  async delete(id: string, accessToken: string): Promise<void> {
    const { error } = await this.supabase
      .forUser(accessToken)
      .from("product_templates")
      .delete()
      .eq("id", id);

    if (error) {
      this.logger.error(`delete(${id}) failed`, error);
      throw new InternalServerErrorException("Échec de la suppression du gabarit");
    }
  }

  private toEntity(row: ProductTemplateRowDb): ProductTemplate {
    const rawFields = Array.isArray(row.fields) ? row.fields : [];
    return {
      id: row.id,
      name: row.name,
      shopId: row.shop_id,
      fields: rawFields.map((f, i) => ({
        ...(f as Omit<ProductTemplateField, "order">),
        order: i,
      })),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private toRow(data: CreateProductTemplate, userId: string) {
    return {
      name: data.name,
      shop_id: data.shopId,
      user_id: userId,
      fields: data.fields.map((f, i) => ({ ...f, order: i })) as Json,
    };
  }
}
