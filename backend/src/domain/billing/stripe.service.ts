import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Stripe from "stripe";

import type { CheckoutPlanId } from "./billing-plan.schema";
import type { ShopSector } from "../shop/dto/shop-sector.schema";

export type CreateBillingCheckoutParams = {
  userId: string;
  customerId: string;
  planId: CheckoutPlanId;
  sector: ShopSector;
  planName: string;
  amountCents: number;
  creditsAmount: number | null;
  useFixedPlatinumPrice: boolean;
};

@Injectable()
export class StripeService {
  private client: Stripe | null = null;

  constructor(private readonly config: ConfigService) {}

  getClient(): Stripe {
    const secretKey = this.config.get<string>("stripeSecretKey")?.trim();
    if (!secretKey) {
      throw new ServiceUnavailableException(
        "Le paiement en ligne n'est pas configuré sur ce serveur",
      );
    }

    if (!this.client) {
      this.client = new Stripe(secretKey);
    }
    return this.client;
  }

  constructWebhookEvent(payload: Buffer, signature: string): Stripe.Event {
    const webhookSecret = this.config.get<string>("stripeWebhookSecret")?.trim();
    if (!webhookSecret) {
      throw new ServiceUnavailableException("Webhook Stripe non configuré sur ce serveur");
    }

    return this.getClient().webhooks.constructEvent(payload, signature, webhookSecret);
  }

  async createCustomer(email: string, userId: string): Promise<string> {
    const customer = await this.getClient().customers.create({
      email,
      metadata: { user_id: userId },
    });
    return customer.id;
  }

  async retrieveSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    return this.getClient().subscriptions.retrieve(subscriptionId);
  }

  /** Crée une session Stripe Checkout pour un forfait pack ou abonnement. */
  async createBillingCheckoutSession(params: CreateBillingCheckoutParams): Promise<string> {
    const successUrl = this.config.getOrThrow<string>("stripeSuccessUrl");
    const cancelUrl = this.config.getOrThrow<string>("stripeCancelUrl");

    const metadata = {
      user_id: params.userId,
      plan_id: params.planId,
      sector: params.sector,
      credits_amount: params.creditsAmount !== null ? String(params.creditsAmount) : "unlimited",
    };

    const isSubscription = params.planId === "platinum";
    const platinumPriceId = this.config.get<string>("stripePricePlatinum")?.trim() ?? "";
    const useFixedPlatinumPrice =
      isSubscription && params.useFixedPlatinumPrice && platinumPriceId.length > 0;

    const session = await this.getClient().checkout.sessions.create({
      mode: isSubscription ? "subscription" : "payment",
      customer: params.customerId,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata,
      ...(isSubscription ? { subscription_data: { metadata } } : {}),
      line_items: [
        isSubscription
          ? useFixedPlatinumPrice
            ? {
                price: platinumPriceId,
                quantity: 1,
              }
            : {
                price_data: {
                  currency: "eur",
                  unit_amount: params.amountCents,
                  recurring: { interval: "month" },
                  product_data: {
                    name: `Fiche Produit — ${params.planName} (${params.sector})`,
                  },
                },
                quantity: 1,
              }
          : {
              price_data: {
                currency: "eur",
                unit_amount: params.amountCents,
                product_data: {
                  name: `Fiche Produit — ${params.planName} (${params.sector})`,
                  description:
                    params.creditsAmount !== null
                      ? `${params.creditsAmount} crédit${params.creditsAmount > 1 ? "s" : ""}`
                      : undefined,
                },
              },
              quantity: 1,
            },
      ],
    });

    if (!session.url) {
      throw new ServiceUnavailableException("Stripe n'a pas renvoyé d'URL de paiement");
    }

    return session.url;
  }
}
