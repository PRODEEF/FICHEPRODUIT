import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from "@nestjs/common";
import {
  CREDIT_LOT_REPOSITORY,
  type ICreditLotRepository,
} from "./repositories/credit-lot.repository.interface";
import {
  CREDIT_TRANSACTION_REPOSITORY,
  type ICreditTransactionRepository,
} from "./repositories/credit-transaction.repository.interface";
import {
  USER_BILLING_REPOSITORY,
  type IUserBillingRepository,
} from "./repositories/user-billing.repository.interface";
import {
  USER_ENTITLEMENT_REPOSITORY,
  type IUserEntitlementRepository,
} from "./repositories/user-entitlement.repository.interface";
import { BillingPricingService } from "./pricing/billing-pricing.service";
import type { BillingPlanId, CreditLot } from "./types/billing.types";
import type {
  ExportDebitComputation,
  ExportDebitMetadata,
  ExportDebitProduct,
} from "./types/export-debit.types";

/** Nombre de crédits offerts à l'inscription — aligné FAQ / FinalCTA. */
export const SIGNUP_CREDIT_AMOUNT = 3;

/** Seuil prix (€) en dessous duquel l'export peut être gratuit avec entitlement Silver+. */
export const FREE_LOW_PRICE_THRESHOLD_EUR = 200;

/** Durée de validité des lots pack et entitlements (mois). */
export const PACK_VALIDITY_MONTHS = 12;

@Injectable()
export class CreditService {
  private readonly logger = new Logger(CreditService.name);

  constructor(
    @Inject(CREDIT_LOT_REPOSITORY)
    private readonly creditLotRepo: ICreditLotRepository,
    @Inject(CREDIT_TRANSACTION_REPOSITORY)
    private readonly creditTransactionRepo: ICreditTransactionRepository,
    @Inject(USER_BILLING_REPOSITORY)
    private readonly userBillingRepo: IUserBillingRepository,
    @Inject(USER_ENTITLEMENT_REPOSITORY)
    private readonly entitlementRepo: IUserEntitlementRepository,
    private readonly pricingService: BillingPricingService,
  ) {}

  /** Somme des crédits restants sur les lots non expirés. */
  async getBalance(userId: string, accessToken: string): Promise<number> {
    const lots = await this.creditLotRepo.findActiveLotsByUser(userId, accessToken);
    return lots.reduce((sum, lot) => sum + lot.amountRemaining, 0);
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
      return await this.creditLotRepo.createLot({
        userId,
        amountInitial: SIGNUP_CREDIT_AMOUNT,
        amountRemaining: SIGNUP_CREDIT_AMOUNT,
        source: "signup_grant",
      });
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
   * Calcule le nombre de crédits à débiter pour un export.
   * Règles : Platinium actif → 0 ; produit < 200 € avec entitlement → 0 ; sinon 1/produit.
   */
  async computeExportDebit(
    userId: string,
    accessToken: string,
    products: ExportDebitProduct[],
  ): Promise<ExportDebitComputation> {
    const [billing, entitlements, available] = await Promise.all([
      this.userBillingRepo.findByUserId(userId, accessToken),
      this.entitlementRepo.findActiveByUser(userId, accessToken),
      this.getBalance(userId, accessToken),
    ]);

    if (billing?.subscriptionStatus === "active") {
      return { required: 0, available, billableProductIds: [] };
    }

    const hasFreeLowPriceExports = entitlements.some((e) => e.type === "free_low_price_exports");
    const billableProductIds = products
      .filter((product) => !this.isProductFreeForExport(product, hasFreeLowPriceExports))
      .map((product) => product.id);

    return {
      required: billableProductIds.length,
      available,
      billableProductIds,
    };
  }

  /**
   * Débite les crédits en FIFO après un export réussi.
   * Ne fait rien si le débit calculé est nul (Platinium ou produits gratuits).
   */
  async debitForExport(
    userId: string,
    accessToken: string,
    products: ExportDebitProduct[],
    metadata: ExportDebitMetadata,
  ): Promise<void> {
    const debit = await this.computeExportDebit(userId, accessToken, products);
    if (debit.required === 0) {
      return;
    }

    if (debit.required > debit.available) {
      this.logger.warn(
        `debitForExport(${userId}) : solde insuffisant (${debit.available}/${debit.required})`,
      );
      throw new InternalServerErrorException("Solde crédits insuffisant pour le débit");
    }

    const lots = await this.creditLotRepo.findActiveLotsForDebitAdmin(userId);
    let remaining = debit.required;
    const txMetadata = {
      product_ids: debit.billableProductIds,
      export_row_count: metadata.exportRowCount,
      requested_product_ids: metadata.productIds,
    };

    for (const lot of lots) {
      if (remaining <= 0) break;

      const take = Math.min(lot.amountRemaining, remaining);
      await this.creditLotRepo.decrementLotRemaining(lot.id, take);
      await this.creditTransactionRepo.createTransaction({
        userId,
        lotId: lot.id,
        delta: -take,
        reason: "export",
        metadata: txMetadata,
      });
      remaining -= take;
    }

    if (remaining > 0) {
      this.logger.error(
        `debitForExport(${userId}) : débit incomplet, ${remaining} crédit(s) non consommés`,
      );
      throw new InternalServerErrorException("Échec du débit des crédits");
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

    if (this.pricingService.planGrantsFreeLowPriceExports(params.planId)) {
      await this.entitlementRepo.grantEntitlement({
        userId: params.userId,
        type: "free_low_price_exports",
        expiresAt,
      });
    }

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

    if (params.periodEnd && this.pricingService.planGrantsFreeLowPriceExports("platinum")) {
      await this.entitlementRepo.grantEntitlement({
        userId: params.userId,
        type: "free_low_price_exports",
        expiresAt: params.periodEnd,
      });
    }

    return lot;
  }

  private isProductFreeForExport(
    product: ExportDebitProduct,
    hasFreeLowPriceExports: boolean,
  ): boolean {
    return hasFreeLowPriceExports && product.price < FREE_LOW_PRICE_THRESHOLD_EUR;
  }

  private addMonths(date: Date, months: number): Date {
    const result = new Date(date);
    result.setMonth(result.getMonth() + months);
    return result;
  }
}
