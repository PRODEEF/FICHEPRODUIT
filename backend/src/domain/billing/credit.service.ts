import { Inject, Injectable } from "@nestjs/common";

import type { AuthenticatedUser } from "../../core/auth/types/jwt-payload.types";
import { CreditGrantService } from "./credit-grant.service";
import { CreditLedgerService } from "./credit-ledger.service";
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
import type { BillingPlanId, BillingSummary, CreditLot } from "./types/billing.types";
import type { ExportDebitMetadata, ExportDebitProduct } from "./types/export-debit.types";

export { SIGNUP_CREDIT_AMOUNT } from "./credit-grant.service";
export { FREE_LOW_PRICE_THRESHOLD_EUR } from "./credit-ledger.service";

/**
 * Façade billing crédits — délègue au ledger (solde, débit) et au grant (octrois, entitlements).
 * Conservée pour les consommateurs existants (`ExportModule`, `UserModule`, webhooks).
 */
@Injectable()
export class CreditService {
  constructor(
    private readonly ledgerService: CreditLedgerService,
    private readonly grantService: CreditGrantService,
    @Inject(CREDIT_TRANSACTION_REPOSITORY)
    private readonly creditTransactionRepo: ICreditTransactionRepository,
    @Inject(USER_BILLING_REPOSITORY)
    private readonly userBillingRepo: IUserBillingRepository,
    @Inject(USER_ENTITLEMENT_REPOSITORY)
    private readonly entitlementRepo: IUserEntitlementRepository,
  ) {}

  async getRecentLots(userId: string, accessToken: string, limit = 20): Promise<CreditLot[]> {
    return this.ledgerService.getRecentLots(userId, accessToken, limit);
  }

  /** Agrège solde, abonnement, avantages et historique pour le profil facturation. */
  async getBillingSummary(user: AuthenticatedUser): Promise<BillingSummary> {
    await this.grantService.grantSignupCredits(user.id);

    const [balance, billing, entitlements, recentPurchases, recentTransactions] = await Promise.all(
      [
        this.ledgerService.getBalance(user.id, user.accessToken),
        this.userBillingRepo.findByUserId(user.id, user.accessToken),
        this.entitlementRepo.findActiveByUser(user.id, user.accessToken),
        this.ledgerService.getRecentLots(user.id, user.accessToken),
        this.creditTransactionRepo.findRecentByUser(user.id, user.accessToken),
      ],
    );

    const hasActiveSubscription = billing?.subscriptionStatus === "active";

    return {
      balance,
      hasUnlimitedExports: hasActiveSubscription,
      subscription: billing
        ? {
            status: billing.subscriptionStatus,
            periodEnd: billing.subscriptionPeriodEnd,
          }
        : null,
      entitlements: entitlements.map((e) => ({
        type: e.type,
        expiresAt: e.expiresAt,
      })),
      recentPurchases: recentPurchases.map((lot) => ({
        id: lot.id,
        amountInitial: lot.amountInitial,
        amountRemaining: lot.amountRemaining,
        source: lot.source,
        planId: lot.planId,
        planName: this.grantService.resolvePlanDisplayName(lot.planId),
        sector: lot.sector,
        expiresAt: lot.expiresAt,
        createdAt: lot.createdAt,
      })),
      recentTransactions: recentTransactions.map((tx) => ({
        id: tx.id,
        delta: tx.delta,
        reason: tx.reason,
        createdAt: tx.createdAt,
        metadata: tx.metadata,
      })),
    };
  }

  async grantFreeLowPriceEntitlementIfApplicable(
    userId: string,
    planId: BillingPlanId,
    expiresAt: string,
  ): Promise<void> {
    return this.grantService.grantFreeLowPriceEntitlementIfApplicable(userId, planId, expiresAt);
  }

  async revokeFreeLowPriceEntitlementIfExpiresAt(userId: string, expiresAt: string): Promise<void> {
    return this.grantService.revokeFreeLowPriceEntitlementIfExpiresAt(userId, expiresAt);
  }

  async getBalance(userId: string, accessToken: string): Promise<number> {
    return this.ledgerService.getBalance(userId, accessToken);
  }

  async grantSignupCredits(userId: string): Promise<CreditLot | null> {
    return this.grantService.grantSignupCredits(userId);
  }

  async computeExportDebit(userId: string, accessToken: string, products: ExportDebitProduct[]) {
    return this.ledgerService.computeExportDebit(userId, accessToken, products);
  }

  async reserveCreditsForExport(
    userId: string,
    accessToken: string,
    products: ExportDebitProduct[],
    metadata: ExportDebitMetadata,
  ): Promise<string | null> {
    return this.ledgerService.reserveCreditsForExport(userId, accessToken, products, metadata);
  }

  async refundExportReservation(userId: string, exportAttemptId: string): Promise<void> {
    return this.ledgerService.refundExportReservation(userId, exportAttemptId);
  }

  async grantPackPurchase(params: {
    userId: string;
    planId: BillingPlanId;
    sector: string;
    creditsAmount: number;
    stripeCheckoutSessionId: string;
  }): Promise<CreditLot | null> {
    return this.grantService.grantPackPurchase(params);
  }

  async grantSubscriptionPeriod(params: {
    userId: string;
    stripeInvoiceId: string;
    periodEnd: string | null;
    sector?: string | null;
  }): Promise<CreditLot | null> {
    return this.grantService.grantSubscriptionPeriod(params);
  }
}
