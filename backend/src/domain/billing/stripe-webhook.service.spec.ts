import { BadRequestException } from "@nestjs/common";
import type { ConfigService } from "@nestjs/config";
import Stripe from "stripe";
import { CreditService } from "./credit.service";
import { BillingPricingService } from "./pricing/billing-pricing.service";
import { StripeWebhookService } from "./stripe-webhook.service";
import type { IUserBillingRepository } from "./repositories/user-billing.repository.interface";
import type { IUserEntitlementRepository } from "./repositories/user-entitlement.repository.interface";

jest.mock("stripe");

describe("StripeWebhookService", () => {
  const creditServiceMock = {
    grantPackPurchase: jest.fn(),
    grantSignupCredits: jest.fn(),
    grantSubscriptionPeriod: jest.fn(),
  } as unknown as jest.Mocked<CreditService>;

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

  const configMock = {
    get: jest.fn((key: string) => {
      if (key === "stripeSecretKey") return "sk_test_xxx";
      if (key === "stripeWebhookSecret") return "whsec_test";
      return "";
    }),
  } as unknown as ConfigService;

  const constructEventMock = jest.fn();
  const subscriptionsRetrieveMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (Stripe as jest.MockedClass<typeof Stripe>).mockImplementation(
      () =>
        ({
          webhooks: { constructEvent: constructEventMock },
          subscriptions: { retrieve: subscriptionsRetrieveMock },
        }) as unknown as Stripe,
    );
  });

  const createService = () =>
    new StripeWebhookService(
      configMock,
      creditServiceMock,
      new BillingPricingService(),
      userBillingRepoMock,
      entitlementRepoMock,
    );

  it("rejette une signature invalide", () => {
    constructEventMock.mockImplementation(() => {
      throw new Error("Invalid signature");
    });

    const service = createService();
    expect(() => service.constructEvent(Buffer.from("{}"), "sig")).toThrow(BadRequestException);
  });

  it("crédite un pack sur checkout.session.completed (idempotent côté CreditService)", async () => {
    const session: Partial<Stripe.Checkout.Session> = {
      id: "cs_test_1",
      mode: "payment",
      payment_status: "paid",
      metadata: {
        user_id: "user-1",
        plan_id: "pro",
        sector: "Glisse",
        credits_amount: "20",
      },
    };

    const event = {
      type: "checkout.session.completed",
      data: { object: session },
    } as Stripe.Event;

    constructEventMock.mockReturnValue(event);
    creditServiceMock.grantPackPurchase = jest.fn().mockResolvedValue({ id: "lot-1" });

    const service = createService();
    await service.handleEvent(event);

    expect(creditServiceMock.grantPackPurchase).toHaveBeenCalledWith({
      userId: "user-1",
      planId: "pro",
      sector: "Glisse",
      creditsAmount: 20,
      stripeCheckoutSessionId: "cs_test_1",
    });
  });

  it("ne crédite pas deux fois si grantPackPurchase est idempotent", async () => {
    const session: Partial<Stripe.Checkout.Session> = {
      id: "cs_test_1",
      mode: "payment",
      payment_status: "paid",
      metadata: {
        user_id: "user-1",
        plan_id: "starter",
        sector: "Vélo",
        credits_amount: "1",
      },
    };

    const event = {
      type: "checkout.session.completed",
      data: { object: session },
    } as Stripe.Event;

    creditServiceMock.grantPackPurchase = jest.fn().mockResolvedValue({ id: "lot-existing" });

    const service = createService();
    await service.handleEvent(event);
    await service.handleEvent(event);

    expect(creditServiceMock.grantPackPurchase).toHaveBeenCalledTimes(2);
  });

  it("synchronise l'abonnement sur customer.subscription.updated", async () => {
    const subscription = {
      id: "sub_1",
      customer: "cus_1",
      status: "active",
      items: {
        data: [{ current_period_end: 1_700_000_000 }],
      },
    } as Stripe.Subscription;

    userBillingRepoMock.findByStripeCustomerId.mockResolvedValue({
      userId: "user-1",
      stripeCustomerId: "cus_1",
      activeSubscriptionId: null,
      subscriptionStatus: null,
      subscriptionPeriodEnd: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const event = {
      type: "customer.subscription.updated",
      data: { object: subscription },
    } as Stripe.Event;

    const service = createService();
    await service.handleEvent(event);

    expect(userBillingRepoMock.updateSubscription).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        activeSubscriptionId: "sub_1",
        subscriptionStatus: "active",
      }),
    );
  });

  it("synchronise Platinium sur checkout.session.completed (mode subscription)", async () => {
    const subscription = {
      id: "sub_platinum",
      customer: "cus_1",
      status: "active",
      metadata: { sector: "Glisse" },
      items: {
        data: [{ current_period_end: 1_800_000_000 }],
      },
    } as unknown as Stripe.Subscription;

    subscriptionsRetrieveMock.mockResolvedValue(subscription);

    const session: Partial<Stripe.Checkout.Session> = {
      id: "cs_sub_1",
      mode: "subscription",
      payment_status: "paid",
      subscription: "sub_platinum",
      metadata: {
        user_id: "user-1",
        plan_id: "platinum",
        sector: "Glisse",
        credits_amount: "unlimited",
      },
    };

    const event = {
      type: "checkout.session.completed",
      data: { object: session },
    } as Stripe.Event;

    const service = createService();
    await service.handleEvent(event);

    expect(subscriptionsRetrieveMock).toHaveBeenCalledWith("sub_platinum");
    expect(userBillingRepoMock.updateSubscription).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        activeSubscriptionId: "sub_platinum",
        subscriptionStatus: "active",
      }),
    );
    expect(creditServiceMock.grantPackPurchase).not.toHaveBeenCalled();
  });

  it("accorde la période Platinium sur invoice.paid (renouvellement)", async () => {
    const subscription = {
      id: "sub_platinum",
      customer: "cus_1",
      status: "active",
      metadata: { sector: "Vélo" },
      items: {
        data: [{ current_period_end: 1_900_000_000 }],
      },
    } as unknown as Stripe.Subscription;

    subscriptionsRetrieveMock.mockResolvedValue(subscription);
    userBillingRepoMock.findByStripeCustomerId.mockResolvedValue({
      userId: "user-1",
      stripeCustomerId: "cus_1",
      activeSubscriptionId: "sub_platinum",
      subscriptionStatus: "active",
      subscriptionPeriodEnd: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    creditServiceMock.grantSubscriptionPeriod = jest.fn().mockResolvedValue({ id: "lot-sub" });

    const invoice = {
      id: "in_1",
      parent: {
        subscription_details: {
          subscription: "sub_platinum",
        },
      },
    } as Stripe.Invoice;

    const event = {
      type: "invoice.paid",
      data: { object: invoice },
    } as Stripe.Event;

    const service = createService();
    await service.handleEvent(event);

    expect(creditServiceMock.grantSubscriptionPeriod).toHaveBeenCalledWith({
      userId: "user-1",
      stripeInvoiceId: "in_1",
      periodEnd: new Date(1_900_000_000 * 1000).toISOString(),
      sector: "Vélo",
    });
  });

  it("résout invoice.paid via le champ legacy subscription", async () => {
    const subscription = {
      id: "sub_legacy",
      customer: "cus_2",
      status: "active",
      items: { data: [{ current_period_end: 1_800_000_000 }] },
    } as Stripe.Subscription;

    subscriptionsRetrieveMock.mockResolvedValue(subscription);
    userBillingRepoMock.findByStripeCustomerId.mockResolvedValue({
      userId: "user-2",
      stripeCustomerId: "cus_2",
      activeSubscriptionId: null,
      subscriptionStatus: null,
      subscriptionPeriodEnd: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const invoice = {
      id: "in_legacy",
      subscription: "sub_legacy",
    } as unknown as Stripe.Invoice;

    const event = {
      type: "invoice.paid",
      data: { object: invoice },
    } as Stripe.Event;

    const service = createService();
    await service.handleEvent(event);

    expect(subscriptionsRetrieveMock).toHaveBeenCalledWith("sub_legacy");
  });

  it("révoque les entitlements à l'annulation customer.subscription.deleted", async () => {
    userBillingRepoMock.findByStripeCustomerId.mockResolvedValue({
      userId: "user-1",
      stripeCustomerId: "cus_1",
      activeSubscriptionId: "sub_1",
      subscriptionStatus: "active",
      subscriptionPeriodEnd: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const subscription = {
      id: "sub_1",
      customer: "cus_1",
      status: "canceled",
      ended_at: 1_700_000_000,
    } as Stripe.Subscription;

    const event = {
      type: "customer.subscription.deleted",
      data: { object: subscription },
    } as Stripe.Event;

    const service = createService();
    await service.handleEvent(event);

    expect(userBillingRepoMock.updateSubscription).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        activeSubscriptionId: null,
        subscriptionStatus: "canceled",
      }),
    );
    expect(entitlementRepoMock.revokeActiveByUserAndType).toHaveBeenCalledWith(
      "user-1",
      "free_low_price_exports",
    );
  });
});
