import { Injectable, InternalServerErrorException, Logger } from "@nestjs/common";
import { SupabaseService } from "../../core/supabase/supabase.service";
import type { Database } from "../../core/supabase/database.types";
import type { IUserRepository } from "./user.repository.interface";
import type { UpdateUserProfile, UserProfile } from "./types/user.types";

type UserRow = Database["public"]["Tables"]["users"]["Row"];

@Injectable()
export class UserRepository implements IUserRepository {
  private readonly logger = new Logger(UserRepository.name);

  constructor(private readonly supabase: SupabaseService) {}

  async findById(id: string, accessToken: string): Promise<UserProfile | null> {
    const { data, error } = await this.supabase
      .forUser(accessToken)
      .from("users")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      this.logger.error(`findById(${id}) failed`, error);
      throw new InternalServerErrorException("Failed to fetch user profile");
    }
    return data ? this.toEntity(data as UserRow) : null;
  }

  async ensureRow(id: string, accessToken: string): Promise<UserProfile> {
    const existing = await this.findById(id, accessToken);
    if (existing) return existing;

    const { error } = await this.supabase.forUser(accessToken).from("users").insert({
      id,
      pending_auto_analyze: false,
    });

    if (error && error.code !== "23505") {
      this.logger.error(`ensureRow insert(${id}) failed`, error);
      throw new InternalServerErrorException("Failed to create user profile");
    }

    const created = await this.findById(id, accessToken);
    if (!created) {
      this.logger.error(`ensureRow: missing row after insert (${id})`);
      throw new InternalServerErrorException("Failed to load user profile");
    }
    return created;
  }

  async update(id: string, patch: UpdateUserProfile, accessToken: string): Promise<UserProfile> {
    const updateRow: Database["public"]["Tables"]["users"]["Update"] = {};

    if (patch.username !== undefined) {
      updateRow.display_name = patch.username;
    }
    if (patch.websiteUrl !== undefined) {
      updateRow.website_url = patch.websiteUrl;
    }
    if (patch.pendingAutoAnalyze !== undefined) {
      updateRow.pending_auto_analyze = patch.pendingAutoAnalyze;
    }

    const { data, error } = await this.supabase
      .forUser(accessToken)
      .from("users")
      .update(updateRow)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      this.logger.error(`update(${id}) failed`, error);
      throw new InternalServerErrorException("Failed to update user profile");
    }
    return this.toEntity(data as UserRow);
  }

  private toEntity(row: UserRow): UserProfile {
    return {
      id: row.id,
      username: row.display_name,
      websiteUrl: row.website_url,
      pendingAutoAnalyze: row.pending_auto_analyze,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
