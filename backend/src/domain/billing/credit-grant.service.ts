import { Inject, Injectable, Logger } from "@nestjs/common";

import { billingPlanIdSchema, type BillingPlanId } from "./billing-plan.schema";
import { BillingPricingService } from "./pricing/billing-pricing.service";
import {
  CREDIT_LOT_REPOSITORY,
  type ICreditLotRepository,
} from "./repositories/credit-lot.repository.interface";
import {
  CREDIT_TRANSACTION_REPOSITORY,
  type ICreditTransactionRepository,
} from "./repositories/credit-transaction.repository.interface";
import {
  USER_ENTITLEMENT_REPOSITORY,
  type IUserEntitlementRepository,
} from "./repositories/user-entitlement.repository.interface";
import type { CreditLot } from "./types/billing.types";

/** Nombre de crédits offerts à l'inscription — aligné FAQ / FinalCTA. */
export const SIGNUP_CREDIT_AMOUNT = 3;

/** Durée de validité des lots pack et entitlements (mois). */
const PACK_VALIDITY_MONTHS = 12;

@Injectable()
export class CreditGrantService {
  private readonly logger = new Logger(CreditGrantService.name);

  constructor(
    @Inject(CREDIT_LOT_REPOSITORY)
    private readonly creditLotRepo: ICreditLotRepository,
    @Inject(CREDIT_TRANSACTION_REPOSITORY)
    private readonly creditTransactionRepo: ICreditTransactionRepository,
    @Inject(USER_ENTITLEMENT_REPOSITORY)
    private readonly entitlementRepo: IUserEntitlementRepository,
    private readonly pricingService: BillingPricingService,
  ) {}

  /**
   * Octroie l'avantage « fiches < 200 € gratuites » si le forfait l'inclut.
   * Point d'entrée unique pour packs, abonnements et webhooks Stripe.
   */
  async grantFreeLowPriceEntitlementIfApplicable(
    userId: string,
    planId: BillingPlanId,
    expiresAt: string,
  ): Promise<void> {
    if (!this.pricingService.planGrantsFreeLowPriceExports(planId)) {
      return;
    }

    await this.entitlementRepo.grantEntitlement({
      userId,
      type: "free_low_price_exports",
      expiresAt,
    });
  }

  /** Révoque l'entitlement free_low_price_exports à l'expiration d'un abonnement. */
  async revokeFreeLowPriceEntitlementIfExpiresAt(userId: string, expiresAt: string): Promise<void> {
    await this.entitlementRepo.revokeActiveEntitlementIfExpiresAt(
      userId,
      "free_low_price_exports",
      expiresAt,
    );
  }

  /**
   * Accorde les crédits d'inscription une seule fois (idempotent via contrainte unique DB).
   */
  async grantSignupCredits(userId: string): Promise<CreditLot | null> {
    const existing = await this.creditLotRepo.findSignupGrantLot(userId);
    if (existing) {
      return existing;
    }

    try {
      const lot = await this.creditLotRepo.createLot({
        userId,
        amountInitial: SIGNUP_CREDIT_AMOUNT,
        amountRemaining: SIGNUP_CREDIT_AMOUNT,
        source: "signup_grant",
      });
      await this.creditTransactionRepo.createTransaction({
        userId,
        lotId: lot.id,
        delta: SIGNUP_CREDIT_AMOUNT,
        reason: "grant",
        metadata: { source: "signup_grant" },
      });
      return lot;
    } catch (err) {
      if (err instanceof Error) {
        this.logger.warn(
          `grantSignupCredits(${userId}) : tentative concurrente ou échec — ${err.message}`,
        );
      }
      const afterRace = await this.creditLotRepo.findSignupGrantLot(userId);
      return afterRace;
    }
  }

  /**
   * Crédite un pack acheté via Stripe Checkout (idempotent via `stripe_checkout_session_id`).
   */
  async grantPackPurchase(params: {
    userId: string;
    planId: BillingPlanId;
    sector: string;
    creditsAmount: number;
    stripeCheckoutSessionId: string;
  }): Promise<CreditLot | null> {
    if (params.planId === "platinum") {
      return null;
    }

    const existing = await this.creditLotRepo.findByStripeCheckoutSessionId(
      params.stripeCheckoutSessionId,
    );
    if (existing) {
      return existing;
    }

    const expiresAt = this.addMonths(new Date(), PACK_VALIDITY_MONTHS).toISOString();

    const lot = await this.creditLotRepo.createLot({
      userId: params.userId,
      amountInitial: params.creditsAmount,
      amountRemaining: params.creditsAmount,
      source: "pack_purchase",
      planId: params.planId,
      sector: params.sector,
      expiresAt,
      stripeCheckoutSessionId: params.stripeCheckoutSessionId,
    });

    await this.creditTransactionRepo.createTransaction({
      userId: params.userId,
      lotId: lot.id,
      delta: params.creditsAmount,
      reason: "grant",
      metadata: {
        source: "pack_purchase",
        plan_id: params.planId,
        plan_name: this.pricingService.getPlanDisplayName(params.planId),
        sector: params.sector,
      },
    });

    await this.grantFreeLowPriceEntitlementIfApplicable(params.userId, params.planId, expiresAt);

    return lot;
  }

  /**
   * Enregistre une période d'abonnement Platinium (idempotent via `stripe_invoice_id`).
   * Les exports illimités reposent sur `subscription_status = active` ; le lot sert de trace
   * comptable (solde nul) et l'entitlement couvre les fiches < 200 € hors abonnement.
   */
  async grantSubscriptionPeriod(params: {
    userId: string;
    stripeInvoiceId: string;
    periodEnd: string | null;
    sector?: string | null;
  }): Promise<CreditLot | null> {
    const existing = await this.creditLotRepo.findByStripeInvoiceId(params.stripeInvoiceId);
    if (existing) {
      return existing;
    }

    const lot = await this.creditLotRepo.createLot({
      userId: params.userId,
      amountInitial: 1,
      amountRemaining: 0,
      source: "subscription_grant",
      planId: "platinum",
      sector: params.sector ?? null,
      expiresAt: params.periodEnd,
      stripeInvoiceId: params.stripeInvoiceId,
    });

    if (params.periodEnd) {
      await this.grantFreeLowPriceEntitlementIfApplicable(
        params.userId,
        "platinum",
        params.periodEnd,
      );
    }

    return lot;
  }

  resolvePlanDisplayName(planId: string | null): string | null {
    if (!planId) return null;
    const parsed = billingPlanIdSchema.safeParse(planId);
    if (!parsed.success) return null;
    return this.pricingService.getPlanDisplayName(parsed.data);
  }

  private addMonths(date: Date, months: number): Date {
    const result = new Date(date);
    result.setMonth(result.getMonth() + months);
    return result;
  }
}
