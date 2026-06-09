import { Inject, Injectable, ServiceUnavailableException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Stripe from "stripe";
import type { AuthenticatedUser } from "../../core/auth/types/jwt-payload.types";
import type { ShopSector } from "../shop/dto/shop-sector.schema";
import { BillingPricingService } from "./pricing/billing-pricing.service";
import { CreditService } from "./credit.service";
import {
  CREDIT_TRANSACTION_REPOSITORY,
  type ICreditTransactionRepository,
} from "./repositories/credit-transaction.repository.interface";
import {
  USER_BILLING_REPOSITORY,
  type IUserBillingRepository,
} from "./repositories/user-billing.repository.interface";
import {
  USER_ENTITLEMENT_REPOSITORY,
  type IUserEntitlementRepository,
} from "./repositories/user-entitlement.repository.interface";
import type { BillingPlanId, BillingSummary } from "./types/billing.types";

@Injectable()
export class BillingService {
  private stripeClient: Stripe | null = null;

  constructor(
    private readonly creditService: CreditService,
    private readonly pricingService: BillingPricingService,
    private readonly config: ConfigService,
    @Inject(USER_BILLING_REPOSITORY)
    private readonly userBillingRepo: IUserBillingRepository,
    @Inject(CREDIT_TRANSACTION_REPOSITORY)
    private readonly creditTransactionRepo: ICreditTransactionRepository,
    @Inject(USER_ENTITLEMENT_REPOSITORY)
    private readonly entitlementRepo: IUserEntitlementRepository,
  ) {}

  async getMe(user: AuthenticatedUser): Promise<BillingSummary> {
    await this.creditService.grantSignupCredits(user.id);

    const [balance, billing, entitlements, recentTransactions] = await Promise.all([
      this.creditService.getBalance(user.id, user.accessToken),
      this.userBillingRepo.findByUserId(user.id, user.accessToken),
      this.entitlementRepo.findActiveByUser(user.id, user.accessToken),
      this.creditTransactionRepo.findRecentByUser(user.id, user.accessToken),
    ]);

    const hasActiveSubscription = billing?.subscriptionStatus === "active";

    return {
      balance,
      hasUnlimitedExports: hasActiveSubscription,
      subscription: billing
        ? {
            status: billing.subscriptionStatus,
            periodEnd: billing.subscriptionPeriodEnd,
          }
        : null,
      entitlements: entitlements.map((e) => ({
        type: e.type,
        expiresAt: e.expiresAt,
      })),
      recentTransactions: recentTransactions.map((tx) => ({
        id: tx.id,
        delta: tx.delta,
        reason: tx.reason,
        createdAt: tx.createdAt,
        metadata: tx.metadata,
      })),
    };
  }

  async createCheckoutSession(
    user: AuthenticatedUser,
    planId: BillingPlanId,
    sector: ShopSector,
  ): Promise<{ url: string }> {
    const stripe = this.getStripeClient();
    const amountCents = this.pricingService.getCheckoutAmountCents(planId, sector);
    const creditsAmount = this.pricingService.getCreditsForPlan(planId);
    const planName = this.pricingService.getPlanDisplayName(planId);

    const billing = await this.userBillingRepo.findByUserId(user.id, user.accessToken);
    let customerId = billing?.stripeCustomerId ?? null;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { user_id: user.id },
      });
      customerId = customer.id;
      await this.userBillingRepo.upsertStripeCustomer(user.id, customerId);
    }

    const successUrl = this.config.get<string>("stripeSuccessUrl") ?? "";
    const cancelUrl = this.config.get<string>("stripeCancelUrl") ?? "";

    const metadata = {
      user_id: user.id,
      plan_id: planId,
      sector,
      credits_amount: creditsAmount !== null ? String(creditsAmount) : "unlimited",
    };

    const isSubscription = planId === "platinum";
    const platinumPriceId = this.config.get<string>("stripePricePlatinum")?.trim() ?? "";
    const useFixedPlatinumPrice =
      isSubscription && platinumPriceId.length > 0 && this.pricingService.usesReferencePrice(sector);

    const session = await stripe.checkout.sessions.create({
      mode: isSubscription ? "subscription" : "payment",
      customer: customerId,
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
                  unit_amount: amountCents,
                  recurring: { interval: "month" },
                  product_data: {
                    name: `FicheProduct — ${planName} (${sector})`,
                  },
                },
                quantity: 1,
              }
          : {
              price_data: {
                currency: "eur",
                unit_amount: amountCents,
                product_data: {
                  name: `FicheProduct — ${planName} (${sector})`,
                  description:
                    creditsAmount !== null
                      ? `${creditsAmount} crédit${creditsAmount > 1 ? "s" : ""}`
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

    return { url: session.url };
  }

  private getStripeClient(): Stripe {
    const secretKey = this.config.get<string>("stripeSecretKey")?.trim();
    if (!secretKey) {
      throw new ServiceUnavailableException(
        "Le paiement en ligne n'est pas configuré sur ce serveur",
      );
    }

    if (!this.stripeClient) {
      this.stripeClient = new Stripe(secretKey);
    }
    return this.stripeClient;
  }
}
