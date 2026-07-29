import { InsufficientCreditsException } from "./exceptions/insufficient-credits.exception";
import { CreditLedgerService } from "./credit-ledger.service";
import type { ICreditLotRepository } from "./repositories/credit-lot.repository.interface";
import type { IUserBillingRepository } from "./repositories/user-billing.repository.interface";
import type { IUserEntitlementRepository } from "./repositories/user-entitlement.repository.interface";
import type { CreditLot, UserBilling, UserEntitlement } from "./types/billing.types";

describe("CreditLedgerService", () => {
  const creditLotRepo: jest.Mocked<ICreditLotRepository> = {
    findRecentLotsByUser: jest.fn(),
    findActiveLotsByUser: jest.fn(),
    findSignupGrantLot: jest.fn(),
    findByStripeCheckoutSessionId: jest.fn(),
    findByStripeInvoiceId: jest.fn(),
    createLot: jest.fn(),
    debitCreditsFifoAdmin: jest.fn(),
    refundExportDebitAdmin: jest.fn(),
  };

  const userBillingRepo: jest.Mocked<IUserBillingRepository> = {
    findByUserId: jest.fn(),
    findByStripeCustomerId: jest.fn(),
    upsertStripeCustomer: jest.fn(),
    updateSubscription: jest.fn(),
  };

  const entitlementRepo: jest.Mocked<IUserEntitlementRepository> = {
    findActiveByUser: jest.fn(),
    grantEntitlement: jest.fn(),
    revokeActiveEntitlementIfExpiresAt: jest.fn(),
  };

  const service = new CreditLedgerService(creditLotRepo, userBillingRepo, entitlementRepo);

  const activeBilling: UserBilling = {
    userId: "u1",
    stripeCustomerId: "cus_1",
    activeSubscriptionId: "sub_1",
    subscriptionStatus: "active",
    subscriptionPeriodEnd: null,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  };

  const lot: CreditLot = {
    id: "lot-1",
    userId: "u1",
    amountInitial: 10,
    amountRemaining: 5,
    source: "pack_purchase",
    planId: "silver",
    sector: "sport",
    expiresAt: null,
    stripeCheckoutSessionId: null,
    stripeInvoiceId: null,
    createdAt: "2024-01-01T00:00:00.000Z",
  };

  const freeLowPriceEntitlement: UserEntitlement = {
    id: "e1",
    userId: "u1",
    type: "free_low_price_exports",
    grantedAt: "2024-01-01T00:00:00.000Z",
    expiresAt: "2025-01-01T00:00:00.000Z",
    revokedAt: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("computeExportDebit", () => {
    it("retourne required 0 si abonnement actif", async () => {
      userBillingRepo.findByUserId.mockResolvedValue(activeBilling);
      entitlementRepo.findActiveByUser.mockResolvedValue([]);
      creditLotRepo.findActiveLotsByUser.mockResolvedValue([]);

      const debit = await service.computeExportDebit("u1", "tok", [
        { id: "p1", price: 50 },
        { id: "p2", price: 300 },
      ]);

      expect(debit).toEqual({ required: 0, available: 0, billableProductIds: [] });
    });

    it("exempte les produits < 200 € avec entitlement free_low_price_exports", async () => {
      userBillingRepo.findByUserId.mockResolvedValue(null);
      entitlementRepo.findActiveByUser.mockResolvedValue([freeLowPriceEntitlement]);
      creditLotRepo.findActiveLotsByUser.mockResolvedValue([lot]);

      const debit = await service.computeExportDebit("u1", "tok", [
        { id: "cheap", price: 199 },
        { id: "expensive", price: 200 },
      ]);

      expect(debit.required).toBe(1);
      expect(debit.billableProductIds).toEqual(["expensive"]);
      expect(debit.available).toBe(5);
    });
  });

  describe("reserveCreditsForExport", () => {
    it("retourne null si aucun crédit requis", async () => {
      userBillingRepo.findByUserId.mockResolvedValue(activeBilling);
      entitlementRepo.findActiveByUser.mockResolvedValue([]);
      creditLotRepo.findActiveLotsByUser.mockResolvedValue([]);

      const attemptId = await service.reserveCreditsForExport(
        "u1",
        "tok",
        [{ id: "p1", price: 10 }],
        {
          exportRowCount: 1,
          productIds: ["p1"],
        },
      );

      expect(attemptId).toBeNull();
      expect(creditLotRepo.debitCreditsFifoAdmin).not.toHaveBeenCalled();
    });

    it("lève InsufficientCreditsException si solde insuffisant", async () => {
      userBillingRepo.findByUserId.mockResolvedValue(null);
      entitlementRepo.findActiveByUser.mockResolvedValue([]);
      creditLotRepo.findActiveLotsByUser.mockResolvedValue([{ ...lot, amountRemaining: 1 }]);

      await expect(
        service.reserveCreditsForExport(
          "u1",
          "tok",
          [
            { id: "p1", price: 500 },
            { id: "p2", price: 500 },
          ],
          { exportRowCount: 2, productIds: ["p1", "p2"] },
        ),
      ).rejects.toBeInstanceOf(InsufficientCreditsException);

      expect(creditLotRepo.debitCreditsFifoAdmin).not.toHaveBeenCalled();
    });

    it("débite en FIFO et retourne un exportAttemptId", async () => {
      userBillingRepo.findByUserId.mockResolvedValue(null);
      entitlementRepo.findActiveByUser.mockResolvedValue([]);
      creditLotRepo.findActiveLotsByUser.mockResolvedValue([{ ...lot, amountRemaining: 10 }]);
      creditLotRepo.debitCreditsFifoAdmin.mockResolvedValue(undefined);

      const attemptId = await service.reserveCreditsForExport(
        "u1",
        "tok",
        [{ id: "p1", price: 500 }],
        { exportRowCount: 1, productIds: ["p1"] },
      );

      expect(typeof attemptId).toBe("string");
      expect(attemptId).toHaveLength(36);
      expect(creditLotRepo.debitCreditsFifoAdmin).toHaveBeenCalledWith(
        "u1",
        1,
        expect.objectContaining({
          product_ids: ["p1"],
          export_attempt_id: attemptId,
        }),
      );
    });
  });
});
