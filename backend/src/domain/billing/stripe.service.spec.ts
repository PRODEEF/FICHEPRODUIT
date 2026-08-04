import { ServiceUnavailableException } from "@nestjs/common";
import type { ConfigService } from "@nestjs/config";
import Stripe from "stripe";

import { StripeService } from "./stripe.service";

const checkoutCreateMock = jest.fn();
const customersCreateMock = jest.fn();
const customersUpdateMock = jest.fn();
const subscriptionsRetrieveMock = jest.fn();
const subscriptionsCancelMock = jest.fn();
const constructEventMock = jest.fn();

jest.mock("stripe", () => {
  // Défini dans la factory : jest.mock est hoisté avant toute déclaration du module.
  class FakeStripeError extends Error {
    code?: string;
    constructor(message: string, code?: string) {
      super(message);
      this.code = code;
    }
  }

  const stripeMock = jest.fn().mockImplementation(() => ({
    customers: { create: customersCreateMock, update: customersUpdateMock },
    checkout: { sessions: { create: checkoutCreateMock } },
    subscriptions: { retrieve: subscriptionsRetrieveMock, cancel: subscriptionsCancelMock },
    webhooks: { constructEvent: constructEventMock },
  }));
  // Réplique la surface `Stripe.errors.StripeError` utilisée par `instanceof` dans le service.
  Object.assign(stripeMock, { errors: { StripeError: FakeStripeError } });
  return {
    __esModule: true,
    default: stripeMock,
  };
});

// Récupère la classe fournie par la factory pour instancier des erreurs Stripe factices.
const FakeStripeError = Stripe.errors.StripeError as unknown as new (
  message: string,
  code?: string,
) => Error & { code?: string };

describe("StripeService", () => {
  const configMock = {
    get: jest.fn((key: string) => {
      if (key === "stripeSecretKey") return "sk_test_123";
      if (key === "stripeWebhookSecret") return "whsec_test";
      if (key === "stripePricePlatinum") return "";
      return undefined;
    }),
    getOrThrow: jest.fn((key: string) => {
      if (key === "stripeSuccessUrl") return "https://app.test/billing/success";
      if (key === "stripeCancelUrl") return "https://app.test/billing/cancel";
      throw new Error(`Config manquante : ${key}`);
    }),
  } as unknown as ConfigService;

  const service = new StripeService(configMock);

  beforeEach(() => {
    jest.clearAllMocks();
    customersCreateMock.mockResolvedValue({ id: "cus_new" });
    customersUpdateMock.mockResolvedValue({ id: "cus_1" });
    checkoutCreateMock.mockResolvedValue({ url: "https://checkout.stripe.test/cs_1" });
    subscriptionsRetrieveMock.mockResolvedValue({ id: "sub_1", status: "active" });
    subscriptionsCancelMock.mockResolvedValue({ id: "sub_1", status: "canceled" });
    constructEventMock.mockReturnValue({ type: "checkout.session.completed" });
  });

  it("lève ServiceUnavailableException si la clé secrète est absente", () => {
    const emptyConfig = {
      get: jest.fn(() => undefined),
      getOrThrow: jest.fn(),
    } as unknown as ConfigService;
    const unconfigured = new StripeService(emptyConfig);

    expect(() => unconfigured.getClient()).toThrow(ServiceUnavailableException);
  });

  it("crée un client Stripe", async () => {
    const customerId = await service.createCustomer("user@test.com", "user-1");

    expect(customerId).toBe("cus_new");
    expect(customersCreateMock).toHaveBeenCalledWith({
      email: "user@test.com",
      metadata: { user_id: "user-1" },
    });
  });

  it("récupère un abonnement Stripe", async () => {
    const subscription = await service.retrieveSubscription("sub_1");

    expect(subscription.id).toBe("sub_1");
    expect(subscriptionsRetrieveMock).toHaveBeenCalledWith("sub_1");
  });

  it("crée une session checkout pack et renvoie l'URL", async () => {
    const url = await service.createBillingCheckoutSession({
      userId: "user-1",
      customerId: "cus_1",
      planId: "starter",
      sector: "Glisse",
      planName: "STARTER",
      amountCents: 1500,
      creditsAmount: 1,
      useFixedPlatinumPrice: false,
    });

    expect(url).toBe("https://checkout.stripe.test/cs_1");
    expect(checkoutCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: "payment",
        customer: "cus_1",
        success_url: "https://app.test/billing/success",
        cancel_url: "https://app.test/billing/cancel",
      }),
    );
  });

  it("crée une session checkout abonnement Platinium", async () => {
    await service.createBillingCheckoutSession({
      userId: "user-1",
      customerId: "cus_1",
      planId: "platinum",
      sector: "Glisse",
      planName: "PLATINIUM",
      amountCents: 50000,
      creditsAmount: null,
      useFixedPlatinumPrice: false,
    });

    expect(checkoutCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: "subscription",
      }),
    );
  });

  it("lève ServiceUnavailableException si Stripe ne renvoie pas d'URL", async () => {
    checkoutCreateMock.mockResolvedValue({ url: null });

    await expect(
      service.createBillingCheckoutSession({
        userId: "user-1",
        customerId: "cus_1",
        planId: "starter",
        sector: "Glisse",
        planName: "STARTER",
        amountCents: 1500,
        creditsAmount: 1,
        useFixedPlatinumPrice: false,
      }),
    ).rejects.toThrow(ServiceUnavailableException);
  });

  it("construit un événement webhook signé", () => {
    const event = service.constructWebhookEvent(Buffer.from("{}"), "sig_test");

    expect(event.type).toBe("checkout.session.completed");
    expect(constructEventMock).toHaveBeenCalled();
  });

  it("annule immédiatement un abonnement Stripe", async () => {
    await service.cancelSubscription("sub_1");

    expect(subscriptionsCancelMock).toHaveBeenCalledWith("sub_1");
  });

  it("ignore silencieusement une erreur `resource_missing` lors de l'annulation", async () => {
    subscriptionsCancelMock.mockRejectedValue(
      new FakeStripeError("No such subscription: sub_gone", "resource_missing"),
    );

    await expect(service.cancelSubscription("sub_gone")).resolves.toBeUndefined();
  });

  it("propage ServiceUnavailableException si Stripe échoue à annuler l'abonnement", async () => {
    subscriptionsCancelMock.mockRejectedValue(
      new FakeStripeError("Stripe unreachable", "api_connection_error"),
    );

    await expect(service.cancelSubscription("sub_1")).rejects.toThrow(ServiceUnavailableException);
  });

  it("anonymise le client Stripe (email, name, phone effacés + metadata deleted_at)", async () => {
    await service.anonymizeCustomer("cus_1");

    expect(customersUpdateMock).toHaveBeenCalledWith(
      "cus_1",
      expect.objectContaining({
        email: "",
        name: "",
        phone: "",
        metadata: expect.objectContaining({ deleted_at: expect.any(String) }),
      }),
    );
  });
});
