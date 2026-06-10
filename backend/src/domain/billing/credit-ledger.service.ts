import { randomUUID } from "node:crypto";

import {
  Inject,
  Injectable,
} from "@nestjs/common";

import { InsufficientCreditsDebitError } from "./exceptions/insufficient-credits-debit.error";
import { InsufficientCreditsException } from "./exceptions/insufficient-credits.exception";
import {
  CREDIT_LOT_REPOSITORY,
  type ICreditLotRepository,
} from "./repositories/credit-lot.repository.interface";
import {
  USER_BILLING_REPOSITORY,
  type IUserBillingRepository,
} from "./repositories/user-billing.repository.interface";
import {
  USER_ENTITLEMENT_REPOSITORY,
  type IUserEntitlementRepository,
} from "./repositories/user-entitlement.repository.interface";
import type { CreditLot } from "./types/billing.types";
import type {
  ExportDebitComputation,
  ExportDebitMetadata,
  ExportDebitProduct,
} from "./types/export-debit.types";

/** Seuil prix (€) en dessous duquel l'export peut être gratuit avec entitlement Silver+. */
export const FREE_LOW_PRICE_THRESHOLD_EUR = 200;

@Injectable()
export class CreditLedgerService {
  constructor(
    @Inject(CREDIT_LOT_REPOSITORY)
    private readonly creditLotRepo: ICreditLotRepository,
    @Inject(USER_BILLING_REPOSITORY)
    private readonly userBillingRepo: IUserBillingRepository,
    @Inject(USER_ENTITLEMENT_REPOSITORY)
    private readonly entitlementRepo: IUserEntitlementRepository,
  ) {}

  /** Lots de crédits récents (achats, offres) pour l'historique profil. */
  async getRecentLots(userId: string, accessToken: string, limit = 20): Promise<CreditLot[]> {
    return this.creditLotRepo.findRecentLotsByUser(userId, accessToken, limit);
  }

  /** Somme des crédits restants sur les lots non expirés. */
  async getBalance(userId: string, accessToken: string): Promise<number> {
    const lots = await this.creditLotRepo.findActiveLotsByUser(userId, accessToken);
    return lots.reduce((sum, lot) => sum + lot.amountRemaining, 0);
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
   * Réserve et débite les crédits en FIFO avant la génération d'export.
   * Le débit atomique Postgres fait foi ; le pré-contrôle évite un aller-retour DB évident.
   * @returns Identifiant de tentative pour remboursement si la génération échoue, sinon `null` si gratuit.
   */
  async reserveCreditsForExport(
    userId: string,
    accessToken: string,
    products: ExportDebitProduct[],
    metadata: ExportDebitMetadata,
  ): Promise<string | null> {
    const debit = await this.computeExportDebit(userId, accessToken, products);
    if (debit.required === 0) {
      return null;
    }

    if (debit.required > debit.available) {
      throw new InsufficientCreditsException(debit.required, debit.available);
    }

    const exportAttemptId = randomUUID();

    try {
      await this.creditLotRepo.debitCreditsFifoAdmin(userId, debit.required, {
        product_ids: debit.billableProductIds,
        export_row_count: metadata.exportRowCount,
        requested_product_ids: metadata.productIds,
        export_attempt_id: exportAttemptId,
      });
    } catch (err) {
      if (err instanceof InsufficientCreditsDebitError) {
        throw new InsufficientCreditsException(debit.required, err.available);
      }
      throw err;
    }

    return exportAttemptId;
  }

  /** Rembourse un débit export si la génération CSV a échoué après réservation. */
  async refundExportReservation(userId: string, exportAttemptId: string): Promise<void> {
    await this.creditLotRepo.refundExportDebitAdmin(userId, exportAttemptId);
  }

  private isProductFreeForExport(
    product: ExportDebitProduct,
    hasFreeLowPriceExports: boolean,
  ): boolean {
    return hasFreeLowPriceExports && product.price < FREE_LOW_PRICE_THRESHOLD_EUR;
  }
}
