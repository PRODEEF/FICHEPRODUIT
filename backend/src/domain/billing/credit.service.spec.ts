import { BillingPricingService } from "./pricing/billing-pricing.service";
import {
  CreditService,
  FREE_LOW_PRICE_THRESHOLD_EUR,
  SIGNUP_CREDIT_AMOUNT,
} from "./credit.service";
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
    findActiveLotsByUser: jest.fn(),
    findActiveLotsForDebitAdmin: jest.fn(),
    findSignupGrantLot: jest.fn(),
    findByStripeCheckoutSessionId: jest.fn(),
    findByStripeInvoiceId: jest.fn(),
    createLot: jest.fn(),
    decrementLotRemaining: jest.fn(),
  };

  const creditTransactionRepoMock: jest.Mocked<ICreditTransactionRepository> = {
    findRecentByUser: jest.fn(),
    createTransaction: jest.fn(),
  };

  const userBillingRepoMock: jest.Mocked<IUserBillingRepository> = {
    findByUserId: jest.fn(),
    findByUserIdAdmin: jest.fn(),
    findByStripeCustomerId: jest.fn(),
    upsertStripeCustomer: jest.fn(),
    updateSubscription: jest.fn(),
  };

  const entitlementRepoMock: jest.Mocked<IUserEntitlementRepository> = {
    findActiveByUser: jest.fn(),
    grantEntitlement: jest.fn(),
    revokeActiveByUserAndType: jest.fn(),
  };

  const pricingService = new BillingPricingService();
  const service = new CreditService(
    creditLotRepoMock,
    creditTransactionRepoMock,
    userBillingRepoMock,
    entitlementRepoMock,
    pricingService,
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

    await service.grantSignupCredits("user-1");
    await service.grantSignupCredits("user-1");

    expect(creditLotRepoMock.createLot).toHaveBeenCalledTimes(1);
    expect(creditLotRepoMock.createLot).toHaveBeenCalledWith({
      userId: "user-1",
      amountInitial: SIGNUP_CREDIT_AMOUNT,
      amountRemaining: SIGNUP_CREDIT_AMOUNT,
      source: "signup_grant",
    });
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
    expect(debit.available).toBe(10);
    expect(debit.billableProductIds).toEqual(["expensive", "premium"]);
  });

  it("débite en FIFO sur le lot le plus ancien en premier", async () => {
    const oldLot: CreditLot = {
      ...signupLot,
      id: "lot-old",
      amountRemaining: 1,
      createdAt: "2024-01-01T00:00:00.000Z",
    };
    const newLot: CreditLot = {
      ...signupLot,
      id: "lot-new",
      amountRemaining: 5,
      source: "pack_purchase",
      createdAt: "2024-06-01T00:00:00.000Z",
    };

    creditLotRepoMock.findActiveLotsByUser.mockResolvedValue([oldLot, newLot]);
    creditLotRepoMock.findActiveLotsForDebitAdmin.mockResolvedValue([oldLot, newLot]);
    creditLotRepoMock.decrementLotRemaining.mockImplementation(async (lotId, amount) => {
      if (lotId === "lot-old") return { ...oldLot, amountRemaining: 0 };
      return { ...newLot, amountRemaining: newLot.amountRemaining - amount };
    });

    await service.debitForExport(
      "user-1",
      "token",
      [
        { id: "p1", price: 300 },
        { id: "p2", price: 400 },
      ],
      { productIds: ["p1", "p2"], exportRowCount: 2 },
    );

    expect(creditLotRepoMock.decrementLotRemaining).toHaveBeenNthCalledWith(1, "lot-old", 1);
    expect(creditLotRepoMock.decrementLotRemaining).toHaveBeenNthCalledWith(2, "lot-new", 1);
    expect(creditTransactionRepoMock.createTransaction).toHaveBeenCalledTimes(2);
  });

  it("ignore les lots expirés au calcul du solde", async () => {
    creditLotRepoMock.findActiveLotsByUser.mockResolvedValue([
      { ...signupLot, amountRemaining: 3 },
    ]);

    const balance = await service.getBalance("user-1", "token");
    expect(balance).toBe(3);
    expect(creditLotRepoMock.findActiveLotsByUser).toHaveBeenCalledWith("user-1", "token");
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
      creditsAmount: 20,
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

  it("grantSubscriptionPeriod crée un lot trace et prolonge l'entitlement", async () => {
    const periodEnd = new Date("2026-12-31T00:00:00.000Z").toISOString();
    creditLotRepoMock.findByStripeInvoiceId.mockResolvedValue(null);
    creditLotRepoMock.createLot.mockResolvedValue({
      ...signupLot,
      id: "lot-sub-new",
      source: "subscription_grant",
      planId: "platinum",
      amountInitial: 1,
      amountRemaining: 0,
      stripeInvoiceId: "in_new",
      expiresAt: periodEnd,
    });

    await service.grantSubscriptionPeriod({
      userId: "user-1",
      stripeInvoiceId: "in_new",
      periodEnd,
      sector: "Glisse",
    });

    expect(creditLotRepoMock.createLot).toHaveBeenCalledWith({
      userId: "user-1",
      amountInitial: 1,
      amountRemaining: 0,
      source: "subscription_grant",
      planId: "platinum",
      sector: "Glisse",
      expiresAt: periodEnd,
      stripeInvoiceId: "in_new",
    });
    expect(entitlementRepoMock.grantEntitlement).toHaveBeenCalledWith({
      userId: "user-1",
      type: "free_low_price_exports",
      expiresAt: periodEnd,
    });
  });
});
