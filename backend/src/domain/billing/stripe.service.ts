import { Injectable, Logger, ServiceUnavailableException } from "@nestjs/common";
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
  private readonly logger = new Logger(StripeService.name);
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

  /**
   * Annule immédiatement un abonnement Stripe. Les erreurs "déjà annulé" (resource_missing
   * ou statut `canceled`) sont journalisées et ignorées : la suppression de compte doit
   * pouvoir continuer même si l'abonnement a déjà été résilié côté Stripe.
   */
  async cancelSubscription(subscriptionId: string): Promise<void> {
    try {
      await this.getClient().subscriptions.cancel(subscriptionId);
    } catch (error) {
      if (this.isAlreadyCanceledError(error)) {
        this.logger.warn(
          `cancelSubscription(${subscriptionId}) : abonnement déjà annulé côté Stripe`,
        );
        return;
      }

      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`cancelSubscription(${subscriptionId}) failed : ${message}`);
      throw new ServiceUnavailableException(
        "L'annulation de l'abonnement Stripe a échoué. Réessayez plus tard.",
      );
    }
  }

  /**
   * Anonymise un client Stripe en effaçant les données personnelles (email, nom, téléphone)
   * et en marquant la métadonnée `deleted_at`. La ligne Stripe reste pour la comptabilité
   * mais ne contient plus d'informations identifiantes.
   */
  async anonymizeCustomer(customerId: string): Promise<void> {
    await this.getClient().customers.update(customerId, {
      email: "",
      name: "",
      phone: "",
      metadata: { deleted_at: new Date().toISOString() },
    });
  }

  private isAlreadyCanceledError(error: unknown): boolean {
    if (!(error instanceof Stripe.errors.StripeError)) return false;
    if (error.code === "resource_missing") return true;
    const message = error.message.toLowerCase();
    return (
      message.includes("no such subscription") ||
      message.includes("already been canceled") ||
      message.includes("already canceled")
    );
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
