import { ServiceUnavailableException } from "@nestjs/common";
import { BillingService } from "./billing.service";
import { BillingPricingService } from "./pricing/billing-pricing.service";
import type { CreditService } from "./credit.service";
import type { IUserBillingRepository } from "./repositories/user-billing.repository.interface";
import type { StripeService } from "./stripe.service";
import type { AuthenticatedUser } from "../../core/auth/types/jwt-payload.types";

describe("BillingService", () => {
  const user: AuthenticatedUser = {
    id: "user-1",
    email: "user@test.com",
    accessToken: "jwt",
  };

  const creditServiceMock = {
    getBillingSummary: jest.fn(),
  } as unknown as jest.Mocked<CreditService>;

  const pricingService = new BillingPricingService();

  const userBillingRepoMock: jest.Mocked<IUserBillingRepository> = {
    findByUserId: jest.fn(),
    findByStripeCustomerId: jest.fn(),
    upsertStripeCustomer: jest.fn(),
    updateSubscription: jest.fn(),
  };

  const stripeServiceMock = {
    createCustomer: jest.fn(),
    createBillingCheckoutSession: jest.fn(),
    getClient: jest.fn(),
  } as unknown as jest.Mocked<StripeService>;

  beforeEach(() => {
    jest.clearAllMocks();
    creditServiceMock.getBillingSummary.mockResolvedValue({
      balance: 3,
      hasUnlimitedExports: true,
      subscription: { status: "active", periodEnd: "2026-12-31T00:00:00.000Z" },
      entitlements: [],
      recentPurchases: [],
      recentTransactions: [],
    });
    userBillingRepoMock.findByUserId.mockResolvedValue(null);
    stripeServiceMock.createCustomer.mockResolvedValue("cus_new");
    stripeServiceMock.createBillingCheckoutSession.mockResolvedValue(
      "https://checkout.stripe.test/cs_1",
    );
  });

  function createService(): BillingService {
    return new BillingService(
      creditServiceMock,
      pricingService,
      stripeServiceMock,
      userBillingRepoMock,
    );
  }

  it("retourne les forfaits calculés pour un secteur", () => {
    const service = createService();
    const result = service.getPlans("Vélo");

    expect(result.sector).toBe("Vélo");
    expect(result.multiplier).toBe(2);
    expect(result.plans.find((p) => p.id === "starter")?.priceEur).toBe(30);
  });

  it("délègue getMe à CreditService.getBillingSummary", async () => {
    const service = createService();
    const summary = await service.getMe(user);

    expect(creditServiceMock.getBillingSummary).toHaveBeenCalledWith(user);
    expect(summary.balance).toBe(3);
    expect(summary.hasUnlimitedExports).toBe(true);
  });

  it("crée un client Stripe puis une session checkout pour un pack", async () => {
    const service = createService();
    const result = await service.createCheckoutSession(user, "starter", "Glisse");

    expect(stripeServiceMock.createCustomer).toHaveBeenCalledWith(user.email, user.id);
    expect(userBillingRepoMock.upsertStripeCustomer).toHaveBeenCalledWith("user-1", "cus_new");
    expect(stripeServiceMock.createBillingCheckoutSession).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: user.id,
        customerId: "cus_new",
        planId: "starter",
        sector: "Glisse",
      }),
    );
    expect(result.url).toBe("https://checkout.stripe.test/cs_1");
  });

  it("réutilise le client Stripe existant sans en créer un nouveau", async () => {
    userBillingRepoMock.findByUserId.mockResolvedValue({
      userId: user.id,
      stripeCustomerId: "cus_existing",
      activeSubscriptionId: null,
      subscriptionStatus: null,
      subscriptionPeriodEnd: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const service = createService();
    await service.createCheckoutSession(user, "starter", "Glisse");

    expect(stripeServiceMock.createCustomer).not.toHaveBeenCalled();
    expect(stripeServiceMock.createBillingCheckoutSession).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: "cus_existing" }),
    );
  });

  it("propage ServiceUnavailableException si Stripe n'est pas configuré", async () => {
    stripeServiceMock.createBillingCheckoutSession.mockRejectedValue(
      new ServiceUnavailableException("Stripe non configuré"),
    );

    const service = createService();

    await expect(service.createCheckoutSession(user, "starter", "Glisse")).rejects.toThrow(
      ServiceUnavailableException,
    );
  });
});
