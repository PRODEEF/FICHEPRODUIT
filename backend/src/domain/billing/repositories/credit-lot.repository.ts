import { Injectable, InternalServerErrorException, Logger } from "@nestjs/common";
import { SupabaseService } from "../../../core/supabase/supabase.service";
import type { Database } from "../../../core/supabase/database.types";
import type { ICreditLotRepository } from "./credit-lot.repository.interface";
import type { CreateCreditLot, CreditLot } from "../types/billing.types";

type CreditLotRow = Database["public"]["Tables"]["credit_lots"]["Row"];

@Injectable()
export class CreditLotRepository implements ICreditLotRepository {
  private readonly logger = new Logger(CreditLotRepository.name);

  constructor(private readonly supabase: SupabaseService) {}

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

  async findActiveLotsForDebitAdmin(userId: string): Promise<CreditLot[]> {
    const now = new Date().toISOString();
    const { data, error } = await this.supabase.admin
      .from("credit_lots")
      .select("*")
      .eq("user_id", userId)
      .gt("amount_remaining", 0)
      .or(`expires_at.is.null,expires_at.gt.${now}`)
      .order("expires_at", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: true });

    if (error) {
      this.logger.error(`findActiveLotsForDebitAdmin(${userId}) failed`, error);
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

  async decrementLotRemaining(lotId: string, amount: number): Promise<CreditLot> {
    const { data: current, error: readError } = await this.supabase.admin
      .from("credit_lots")
      .select("amount_remaining")
      .eq("id", lotId)
      .single();

    if (readError || !current) {
      this.logger.error(`decrementLotRemaining read(${lotId}) failed`, readError);
      throw new InternalServerErrorException("Échec de la lecture du lot de crédits");
    }

    const nextRemaining = current.amount_remaining - amount;
    if (nextRemaining < 0) {
      throw new InternalServerErrorException("Solde du lot insuffisant pour le débit");
    }

    const { data, error } = await this.supabase.admin
      .from("credit_lots")
      .update({ amount_remaining: nextRemaining })
      .eq("id", lotId)
      .select()
      .single();

    if (error || !data) {
      this.logger.error(`decrementLotRemaining(${lotId}) failed`, error);
      throw new InternalServerErrorException("Échec de la mise à jour du lot de crédits");
    }

    return this.toEntity(data as CreditLotRow);
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
