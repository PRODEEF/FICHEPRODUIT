import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from "@nestjs/common";
import { SupabaseService } from "../../../core/supabase/supabase.service";
import type { Database } from "../../../core/supabase/database.types";
import { InsufficientCreditsDebitError } from "../exceptions/insufficient-credits-debit.error";
import type { ICreditLotRepository } from "./credit-lot.repository.interface";
import type { CreateCreditLot, CreditLot } from "../types/billing.types";

type CreditLotRow = Database["public"]["Tables"]["credit_lots"]["Row"];

type RpcError = { code?: string; message?: string; details?: string };

/** Client admin typé pour les RPC billing non encore présents dans `database.types`. */
type BillingAdminRpcClient = {
  rpc(
    fn: "debit_credits_fifo",
    args: {
      p_user_id: string;
      p_amount: number;
      p_metadata: Record<string, unknown>;
    },
  ): Promise<{ error: RpcError | null }>;
  rpc(
    fn: "refund_export_debit",
    args: { p_user_id: string; p_export_attempt_id: string },
  ): Promise<{ error: RpcError | null }>;
};

@Injectable()
export class CreditLotRepository implements ICreditLotRepository {
  private readonly logger = new Logger(CreditLotRepository.name);

  constructor(private readonly supabase: SupabaseService) {}

  async findRecentLotsByUser(
    userId: string,
    accessToken: string,
    limit = 20,
  ): Promise<CreditLot[]> {
    const { data, error } = await this.supabase
      .forUser(accessToken)
      .from("credit_lots")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      this.logger.error(`findRecentLotsByUser(${userId}) failed`, error);
      throw new InternalServerErrorException("Échec de la récupération de l'historique d'achats");
    }

    return (data ?? []).map((row) => this.toEntity(row as CreditLotRow));
  }

  async findActiveLotsByUser(userId: string, accessToken: string): Promise<CreditLot[]> {
    const now = new Date().toISOString();
    const { data, error } = await this.supabase
      .forUser(accessToken)
      .from("credit_lots")
      .select("*")
      .eq("user_id", userId)
      .gt("amount_remaining", 0)
      .or(`expires_at.is.null,expires_at.gt.${now}`);

    if (error) {
      this.logger.error(`findActiveLotsByUser(${userId}) failed`, error);
      throw new InternalServerErrorException("Échec de la récupération des lots de crédits");
    }

    return (data ?? []).map((row) => this.toEntity(row as CreditLotRow));
  }

  async findSignupGrantLot(userId: string): Promise<CreditLot | null> {
    const { data, error } = await this.supabase.admin
      .from("credit_lots")
      .select("*")
      .eq("user_id", userId)
      .eq("source", "signup_grant")
      .maybeSingle();

    if (error) {
      this.logger.error(`findSignupGrantLot(${userId}) failed`, error);
      throw new InternalServerErrorException("Échec de la vérification des crédits d'inscription");
    }

    return data ? this.toEntity(data as CreditLotRow) : null;
  }

  async findByStripeCheckoutSessionId(sessionId: string): Promise<CreditLot | null> {
    const { data, error } = await this.supabase.admin
      .from("credit_lots")
      .select("*")
      .eq("stripe_checkout_session_id", sessionId)
      .maybeSingle();

    if (error) {
      this.logger.error(`findByStripeCheckoutSessionId(${sessionId}) failed`, error);
      throw new InternalServerErrorException("Échec de la vérification du lot de crédits");
    }

    return data ? this.toEntity(data as CreditLotRow) : null;
  }

  async findByStripeInvoiceId(invoiceId: string): Promise<CreditLot | null> {
    const { data, error } = await this.supabase.admin
      .from("credit_lots")
      .select("*")
      .eq("stripe_invoice_id", invoiceId)
      .maybeSingle();

    if (error) {
      this.logger.error(`findByStripeInvoiceId(${invoiceId}) failed`, error);
      throw new InternalServerErrorException("Échec de la vérification du lot d'abonnement");
    }

    return data ? this.toEntity(data as CreditLotRow) : null;
  }

  async createLot(data: CreateCreditLot): Promise<CreditLot> {
    const insertRow: Database["public"]["Tables"]["credit_lots"]["Insert"] = {
      user_id: data.userId,
      amount_initial: data.amountInitial,
      amount_remaining: data.amountRemaining,
      source: data.source,
      plan_id: data.planId ?? null,
      sector: data.sector ?? null,
      expires_at: data.expiresAt ?? null,
      stripe_checkout_session_id: data.stripeCheckoutSessionId ?? null,
      stripe_invoice_id: data.stripeInvoiceId ?? null,
    };

    const { data: row, error } = await this.supabase.admin
      .from("credit_lots")
      .insert(insertRow)
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        if (data.stripeCheckoutSessionId) {
          const bySession = await this.findByStripeCheckoutSessionId(data.stripeCheckoutSessionId);
          if (bySession) return bySession;
        }
        if (data.stripeInvoiceId) {
          const byInvoice = await this.findByStripeInvoiceId(data.stripeInvoiceId);
          if (byInvoice) return byInvoice;
        }
        const existing = await this.findSignupGrantLot(data.userId);
        if (existing) return existing;
      }
      this.logger.error(`createLot(user=${data.userId}, source=${data.source}) failed`, error);
      throw new InternalServerErrorException("Échec de la création du lot de crédits");
    }

    return this.toEntity(row as CreditLotRow);
  }

  async debitCreditsFifoAdmin(
    userId: string,
    amount: number,
    metadata: Record<string, unknown>,
  ): Promise<void> {
    const admin = this.supabase.admin as unknown as BillingAdminRpcClient;
    const { error } = await admin.rpc("debit_credits_fifo", {
      p_user_id: userId,
      p_amount: amount,
      p_metadata: metadata,
    });

    if (!error) {
      return;
    }

    if (error.code === "P0001" || error.message?.includes("INSUFFICIENT_CREDITS")) {
      throw new InsufficientCreditsDebitError(this.parseInsufficientCreditsDetail(error.details));
    }

    this.logger.error(`debitCreditsFifoAdmin(${userId}, ${amount}) failed`, error);
    throw new InternalServerErrorException("Échec du débit des crédits");
  }

  async refundExportDebitAdmin(userId: string, exportAttemptId: string): Promise<void> {
    const admin = this.supabase.admin as unknown as BillingAdminRpcClient;
    const { error } = await admin.rpc("refund_export_debit", {
      p_user_id: userId,
      p_export_attempt_id: exportAttemptId,
    });

    if (error) {
      this.logger.error(
        `refundExportDebitAdmin(${userId}, ${exportAttemptId}) failed`,
        error,
      );
      throw new InternalServerErrorException("Échec du remboursement des crédits");
    }
  }

  private parseInsufficientCreditsDetail(details: string | undefined): number {
    if (!details) {
      return 0;
    }
    const parsed = Number.parseInt(details, 10);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private toEntity(row: CreditLotRow): CreditLot {
    return {
      id: row.id,
      userId: row.user_id,
      amountInitial: row.amount_initial,
      amountRemaining: row.amount_remaining,
      source: row.source,
      planId: row.plan_id,
      sector: row.sector,
      expiresAt: row.expires_at,
      stripeCheckoutSessionId: row.stripe_checkout_session_id,
      stripeInvoiceId: row.stripe_invoice_id,
      createdAt: row.created_at,
    };
  }
}
