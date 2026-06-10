import { BadRequestException } from "@nestjs/common";
import Stripe from "stripe";
import { CreditService } from "./credit.service";
import { StripeWebhookService } from "./stripe-webhook.service";
import type { IUserBillingRepository } from "./repositories/user-billing.repository.interface";
import type { StripeService } from "./stripe.service";
import type { CreditLot } from "./types/billing.types";

describe("StripeWebhookService", () => {
  const creditServiceMock = {
    grantPackPurchase: jest.fn(),
    grantSubscriptionPeriod: jest.fn(),
    grantFreeLowPriceEntitlementIfApplicable: jest.fn(),
    revokeFreeLowPriceEntitlementIfExpiresAt: jest.fn(),
  } as unknown as jest.Mocked<CreditService>;

  const userBillingRepoMock: jest.Mocked<IUserBillingRepository> = {
    findByUserId: jest.fn(),
    findByStripeCustomerId: jest.fn(),
    upsertStripeCustomer: jest.fn(),
    updateSubscription: jest.fn(),
  };

  const constructWebhookEventMock = jest.fn();
  const subscriptionsRetrieveMock = jest.fn();

  const stripeServiceMock = {
    constructWebhookEvent: constructWebhookEventMock,
    retrieveSubscription: subscriptionsRetrieveMock,
    getClient: jest.fn(),
  } as unknown as jest.Mocked<StripeService>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createService = () =>
    new StripeWebhookService(stripeServiceMock, creditServiceMock, userBillingRepoMock);

  it("rejette une signature invalide", () => {
    constructWebhookEventMock.mockImplementation(() => {
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
        credits_amount: "10",
      },
    };

    const event = {
      type: "checkout.session.completed",
      data: { object: session },
    } as Stripe.Event;

    constructWebhookEventMock.mockReturnValue(event);
    creditServiceMock.grantPackPurchase.mockResolvedValue({ id: "lot-1" } as CreditLot);

    const service = createService();
    await service.handleEvent(event);

    expect(creditServiceMock.grantPackPurchase).toHaveBeenCalledWith({
      userId: "user-1",
      planId: "pro",
      sector: "Glisse",
      creditsAmount: 10,
      stripeCheckoutSessionId: "cs_test_1",
    });
  });

  it("ignore un plan_id invalide sur checkout.session.completed", async () => {
    const session: Partial<Stripe.Checkout.Session> = {
      id: "cs_test_bad",
      mode: "payment",
      payment_status: "paid",
      metadata: {
        user_id: "user-1",
        plan_id: "invalid_plan",
        sector: "Glisse",
        credits_amount: "10",
      },
    };

    const event = {
      type: "checkout.session.completed",
      data: { object: session },
    } as Stripe.Event;

    const service = createService();
    await service.handleEvent(event);

    expect(creditServiceMock.grantPackPurchase).not.toHaveBeenCalled();
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

    creditServiceMock.grantPackPurchase.mockResolvedValue({ id: "lot-existing" } as CreditLot);

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
    expect(creditServiceMock.grantFreeLowPriceEntitlementIfApplicable).toHaveBeenCalled();
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
    creditServiceMock.grantSubscriptionPeriod.mockResolvedValue({ id: "lot-sub" } as CreditLot);

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
    expect(creditServiceMock.revokeFreeLowPriceEntitlementIfExpiresAt).toHaveBeenCalledWith(
      "user-1",
      expect.any(String),
    );
  });
});
