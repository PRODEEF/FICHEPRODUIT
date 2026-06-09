import { Injectable, InternalServerErrorException, Logger } from "@nestjs/common";
import { SupabaseService } from "../../../core/supabase/supabase.service";
import type { Database } from "../../../core/supabase/database.types";
import type {
  CreateUserEntitlement,
  IUserEntitlementRepository,
} from "./user-entitlement.repository.interface";
import type { UserEntitlement, UserEntitlementType } from "../types/billing.types";

type UserEntitlementRow = Database["public"]["Tables"]["user_entitlements"]["Row"];

@Injectable()
export class UserEntitlementRepository implements IUserEntitlementRepository {
  private readonly logger = new Logger(UserEntitlementRepository.name);

  constructor(private readonly supabase: SupabaseService) {}

  async findActiveByUser(userId: string, accessToken: string): Promise<UserEntitlement[]> {
    const now = new Date().toISOString();
    const { data, error } = await this.supabase
      .forUser(accessToken)
      .from("user_entitlements")
      .select("*")
      .eq("user_id", userId)
      .is("revoked_at", null)
      .gt("expires_at", now);

    if (error) {
      this.logger.error(`findActiveByUser(${userId}) failed`, error);
      throw new InternalServerErrorException("Échec de la récupération des avantages");
    }

    return (data ?? []).map((row) => this.toEntity(row as UserEntitlementRow));
  }

  async grantEntitlement(data: CreateUserEntitlement): Promise<UserEntitlement> {
    const now = new Date().toISOString();

    const { error: revokeError } = await this.supabase.admin
      .from("user_entitlements")
      .update({ revoked_at: now })
      .eq("user_id", data.userId)
      .eq("type", data.type)
      .is("revoked_at", null);

    if (revokeError) {
      this.logger.error(`grantEntitlement revoke(${data.userId}) failed`, revokeError);
      throw new InternalServerErrorException("Échec de la révocation de l'avantage précédent");
    }

    const insertRow: Database["public"]["Tables"]["user_entitlements"]["Insert"] = {
      user_id: data.userId,
      type: data.type,
      expires_at: data.expiresAt,
    };

    const { data: row, error } = await this.supabase.admin
      .from("user_entitlements")
      .insert(insertRow)
      .select()
      .single();

    if (error) {
      this.logger.error(`grantEntitlement(${data.userId}) failed`, error);
      throw new InternalServerErrorException("Échec de l'octroi de l'avantage");
    }

    return this.toEntity(row as UserEntitlementRow);
  }

  async revokeActiveByUserAndType(userId: string, type: UserEntitlementType): Promise<void> {
    const now = new Date().toISOString();
    const { error } = await this.supabase.admin
      .from("user_entitlements")
      .update({ revoked_at: now })
      .eq("user_id", userId)
      .eq("type", type)
      .is("revoked_at", null);

    if (error) {
      this.logger.error(`revokeActiveByUserAndType(${userId}, ${type}) failed`, error);
      throw new InternalServerErrorException("Échec de la révocation de l'avantage");
    }
  }

  private toEntity(row: UserEntitlementRow): UserEntitlement {
    return {
      id: row.id,
      userId: row.user_id,
      type: row.type as UserEntitlementType,
      grantedAt: row.granted_at,
      expiresAt: row.expires_at,
      revokedAt: row.revoked_at,
    };
  }
}
