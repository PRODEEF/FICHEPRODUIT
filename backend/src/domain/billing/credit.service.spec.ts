import { BillingPricingService } from "./pricing/billing-pricing.service";
import { CreditGrantService, SIGNUP_CREDIT_AMOUNT } from "./credit-grant.service";
import { CreditLedgerService, FREE_LOW_PRICE_THRESHOLD_EUR } from "./credit-ledger.service";
import { CreditService } from "./credit.service";
import type { ICreditLotRepository } from "./repositories/credit-lot.repository.interface";
import type { ICreditTransactionRepository } from "./repositories/credit-transaction.repository.interface";
import type { IUserBillingRepository } from "./repositories/user-billing.repository.interface";
import type { IUserEntitlementRepository } from "./repositories/user-entitlement.repository.interface";
import type { CreditLot } from "./types/billing.types";

describe("CreditService", () => {
  const signupLot: CreditLot = {
    id: "lot-1",
    userId: "user-1",
    amountInitial: SIGNUP_CREDIT_AMOUNT,
    amountRemaining: SIGNUP_CREDIT_AMOUNT,
    source: "signup_grant",
    planId: null,
    sector: null,
    expiresAt: null,
    stripeCheckoutSessionId: null,
    stripeInvoiceId: null,
    createdAt: new Date().toISOString(),
  };

  const creditLotRepoMock: jest.Mocked<ICreditLotRepository> = {
    findRecentLotsByUser: jest.fn(),
    findActiveLotsByUser: jest.fn(),
    findSignupGrantLot: jest.fn(),
    findByStripeCheckoutSessionId: jest.fn(),
    findByStripeInvoiceId: jest.fn(),
    createLot: jest.fn(),
    debitCreditsFifoAdmin: jest.fn(),
    refundExportDebitAdmin: jest.fn(),
  };

  const creditTransactionRepoMock: jest.Mocked<ICreditTransactionRepository> = {
    findRecentByUser: jest.fn(),
    createTransaction: jest.fn(),
  };

  const userBillingRepoMock: jest.Mocked<IUserBillingRepository> = {
    findByUserId: jest.fn(),
    findByStripeCustomerId: jest.fn(),
    upsertStripeCustomer: jest.fn(),
    updateSubscription: jest.fn(),
  };

  const entitlementRepoMock: jest.Mocked<IUserEntitlementRepository> = {
    findActiveByUser: jest.fn(),
    grantEntitlement: jest.fn(),
    revokeActiveEntitlementIfExpiresAt: jest.fn(),
  };

  const pricingService = new BillingPricingService();
  const grantService = new CreditGrantService(
    creditLotRepoMock,
    creditTransactionRepoMock,
    entitlementRepoMock,
    pricingService,
  );
  const ledgerService = new CreditLedgerService(
    creditLotRepoMock,
    userBillingRepoMock,
    entitlementRepoMock,
  );
  const service = new CreditService(
    ledgerService,
    grantService,
    creditTransactionRepoMock,
    userBillingRepoMock,
    entitlementRepoMock,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    userBillingRepoMock.findByUserId.mockResolvedValue(null);
    entitlementRepoMock.findActiveByUser.mockResolvedValue([]);
    creditLotRepoMock.findActiveLotsByUser.mockResolvedValue([]);
  });

  it("calcule le solde à partir des lots actifs", async () => {
    creditLotRepoMock.findActiveLotsByUser.mockResolvedValue([
      { ...signupLot, amountRemaining: 2 },
      {
        ...signupLot,
        id: "lot-2",
        amountRemaining: 5,
        source: "pack_purchase",
      },
    ]);

    await expect(service.getBalance("user-1", "token")).resolves.toBe(7);
  });

  it("n'accorde les crédits signup qu'une seule fois", async () => {
    creditLotRepoMock.findSignupGrantLot.mockResolvedValueOnce(null).mockResolvedValue(signupLot);
    creditLotRepoMock.createLot.mockResolvedValue(signupLot);
    creditTransactionRepoMock.createTransaction.mockResolvedValue({
      id: "tx-1",
      userId: "user-1",
      lotId: signupLot.id,
      delta: SIGNUP_CREDIT_AMOUNT,
      reason: "grant",
      metadata: { source: "signup_grant" },
      createdAt: new Date().toISOString(),
    });

    await service.grantSignupCredits("user-1");
    await service.grantSignupCredits("user-1");

    expect(creditLotRepoMock.createLot).toHaveBeenCalledTimes(1);
    expect(creditTransactionRepoMock.createTransaction).toHaveBeenCalledTimes(1);
  });

  it("ne crée pas de transaction signup si le lot existe déjà", async () => {
    creditLotRepoMock.findSignupGrantLot.mockResolvedValue(signupLot);

    await service.grantSignupCredits("user-1");

    expect(creditLotRepoMock.createLot).not.toHaveBeenCalled();
    expect(creditTransactionRepoMock.createTransaction).not.toHaveBeenCalled();
  });

  it("calcule un débit nul pour un abonnement Platinium actif", async () => {
    userBillingRepoMock.findByUserId.mockResolvedValue({
      userId: "user-1",
      stripeCustomerId: "cus_1",
      activeSubscriptionId: "sub_1",
      subscriptionStatus: "active",
      subscriptionPeriodEnd: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const debit = await service.computeExportDebit("user-1", "token", [
      { id: "p1", price: 500 },
      { id: "p2", price: 50 },
    ]);

    expect(debit).toEqual({ required: 0, available: 0, billableProductIds: [] });
  });

  it("exonère les produits < 200 € avec entitlement free_low_price_exports", async () => {
    entitlementRepoMock.findActiveByUser.mockResolvedValue([
      {
        id: "ent-1",
        userId: "user-1",
        type: "free_low_price_exports",
        grantedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        revokedAt: null,
      },
    ]);
    creditLotRepoMock.findActiveLotsByUser.mockResolvedValue([
      { ...signupLot, amountRemaining: 10 },
    ]);

    const debit = await service.computeExportDebit("user-1", "token", [
      { id: "cheap", price: FREE_LOW_PRICE_THRESHOLD_EUR - 1 },
      { id: "expensive", price: FREE_LOW_PRICE_THRESHOLD_EUR },
      { id: "premium", price: 999 },
    ]);

    expect(debit.required).toBe(2);
    expect(debit.billableProductIds).toEqual(["expensive", "premium"]);
  });

  it("réserve les crédits via débit FIFO atomique", async () => {
    creditLotRepoMock.findActiveLotsByUser.mockResolvedValue([
      { ...signupLot, amountRemaining: 5 },
    ]);
    creditLotRepoMock.debitCreditsFifoAdmin.mockResolvedValue(undefined);

    const attemptId = await service.reserveCreditsForExport(
      "user-1",
      "token",
      [
        { id: "p1", price: 300 },
        { id: "p2", price: 400 },
      ],
      { productIds: ["p1", "p2"], exportRowCount: 2 },
    );

    expect(attemptId).toEqual(expect.any(String));
    expect(creditLotRepoMock.debitCreditsFifoAdmin).toHaveBeenCalled();
  });

  it("lève InsufficientCreditsException sans appeler le RPC si le solde est clairement insuffisant", async () => {
    const { InsufficientCreditsException } =
      await import("./exceptions/insufficient-credits.exception");

    creditLotRepoMock.findActiveLotsByUser.mockResolvedValue([
      { ...signupLot, amountRemaining: 1 },
    ]);

    await expect(
      service.reserveCreditsForExport(
        "user-1",
        "token",
        [
          { id: "p1", price: 300 },
          { id: "p2", price: 400 },
        ],
        { productIds: ["p1", "p2"], exportRowCount: 2 },
      ),
    ).rejects.toBeInstanceOf(InsufficientCreditsException);

    expect(creditLotRepoMock.debitCreditsFifoAdmin).not.toHaveBeenCalled();
  });

  it("rembourse une réservation export", async () => {
    await service.refundExportReservation("user-1", "attempt-abc");

    expect(creditLotRepoMock.refundExportDebitAdmin).toHaveBeenCalledWith("user-1", "attempt-abc");
  });

  it("grantPackPurchase est idempotent via stripe_checkout_session_id", async () => {
    const packLot: CreditLot = {
      ...signupLot,
      id: "lot-pack",
      amountInitial: 20,
      amountRemaining: 20,
      source: "pack_purchase",
      stripeCheckoutSessionId: "cs_test_1",
    };

    creditLotRepoMock.findByStripeCheckoutSessionId.mockResolvedValue(packLot);

    const result = await service.grantPackPurchase({
      userId: "user-1",
      planId: "pro",
      sector: "Glisse",
      creditsAmount: 10,
      stripeCheckoutSessionId: "cs_test_1",
    });

    expect(result).toBe(packLot);
    expect(creditLotRepoMock.createLot).not.toHaveBeenCalled();
  });

  it("accorde entitlement Silver+ à l'achat d'un pack business_silver", async () => {
    creditLotRepoMock.findByStripeCheckoutSessionId.mockResolvedValue(null);
    creditLotRepoMock.createLot.mockResolvedValue({
      ...signupLot,
      source: "pack_purchase",
      amountInitial: 100,
      amountRemaining: 100,
    });

    await service.grantPackPurchase({
      userId: "user-1",
      planId: "business_silver",
      sector: "Vélo",
      creditsAmount: 100,
      stripeCheckoutSessionId: "cs_test_2",
    });

    expect(entitlementRepoMock.grantEntitlement).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        type: "free_low_price_exports",
      }),
    );
  });

  it("révoque l'entitlement free_low_price_exports à l'expiration", async () => {
    const expiresAt = "2026-12-31T00:00:00.000Z";

    await service.revokeFreeLowPriceEntitlementIfExpiresAt("user-1", expiresAt);

    expect(entitlementRepoMock.revokeActiveEntitlementIfExpiresAt).toHaveBeenCalledWith(
      "user-1",
      "free_low_price_exports",
      expiresAt,
    );
  });

  it("grantSubscriptionPeriod est idempotent via stripe_invoice_id", async () => {
    const subscriptionLot: CreditLot = {
      ...signupLot,
      id: "lot-sub",
      source: "subscription_grant",
      planId: "platinum",
      amountInitial: 1,
      amountRemaining: 0,
      stripeInvoiceId: "in_1",
    };

    creditLotRepoMock.findByStripeInvoiceId.mockResolvedValue(subscriptionLot);

    const result = await service.grantSubscriptionPeriod({
      userId: "user-1",
      stripeInvoiceId: "in_1",
      periodEnd: new Date().toISOString(),
    });

    expect(result).toBe(subscriptionLot);
    expect(creditLotRepoMock.createLot).not.toHaveBeenCalled();
  });
});
