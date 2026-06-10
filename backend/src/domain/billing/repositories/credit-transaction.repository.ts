import { Injectable, InternalServerErrorException, Logger } from "@nestjs/common";
import { SupabaseService } from "../../../core/supabase/supabase.service";
import type { Database, Json } from "../../../core/supabase/database.types";
import type {
  CreateCreditTransaction,
  ICreditTransactionRepository,
} from "./credit-transaction.repository.interface";
import type { CreditTransaction } from "../types/billing.types";

type CreditTransactionRow = Database["public"]["Tables"]["credit_transactions"]["Row"];

@Injectable()
export class CreditTransactionRepository implements ICreditTransactionRepository {
  private readonly logger = new Logger(CreditTransactionRepository.name);

  constructor(private readonly supabase: SupabaseService) {}

  async findRecentByUser(
    userId: string,
    accessToken: string,
    limit = 10,
  ): Promise<CreditTransaction[]> {
    const { data, error } = await this.supabase
      .forUser(accessToken)
      .from("credit_transactions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      this.logger.error(`findRecentByUser(${userId}) failed`, error);
      throw new InternalServerErrorException("Échec de la récupération de l'historique crédits");
    }

    return (data ?? []).map((row) => this.toEntity(row as CreditTransactionRow));
  }

  async createTransaction(data: CreateCreditTransaction): Promise<CreditTransaction> {
    const insertRow: Database["public"]["Tables"]["credit_transactions"]["Insert"] = {
      user_id: data.userId,
      lot_id: data.lotId,
      delta: data.delta,
      reason: data.reason,
      metadata: (data.metadata ?? {}) as Json,
    };

    const { data: row, error } = await this.supabase.admin
      .from("credit_transactions")
      .insert(insertRow)
      .select()
      .single();

    if (error) {
      this.logger.error(`createTransaction(user=${data.userId}) failed`, error);
      throw new InternalServerErrorException("Échec de l'enregistrement de la transaction crédit");
    }

    return this.toEntity(row as CreditTransactionRow);
  }

  private toEntity(row: CreditTransactionRow): CreditTransaction {
    return {
      id: row.id,
      userId: row.user_id,
      lotId: row.lot_id,
      delta: row.delta,
      reason: row.reason,
      metadata: this.parseMetadata(row.metadata),
      createdAt: row.created_at,
    };
  }

  private parseMetadata(value: Json): Record<string, unknown> {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      return value as Record<string, unknown>;
    }
    return {};
  }
}
