import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from "@nestjs/common";
import Stripe from "stripe";
import { billingPlanIdSchema } from "./billing-plan.schema";
import { CreditService } from "./credit.service";
import {
  USER_BILLING_REPOSITORY,
  type IUserBillingRepository,
} from "./repositories/user-billing.repository.interface";
import { StripeService } from "./stripe.service";

const HANDLED_EVENTS = new Set([
  "checkout.session.completed",
  "invoice.paid",
  "customer.subscription.updated",
  "customer.subscription.deleted",
]);

@Injectable()
export class StripeWebhookService {
  private readonly logger = new Logger(StripeWebhookService.name);

  constructor(
    private readonly stripeService: StripeService,
    private readonly creditService: CreditService,
    @Inject(USER_BILLING_REPOSITORY)
    private readonly userBillingRepo: IUserBillingRepository,
  ) {}

  constructEvent(payload: Buffer, signature: string): Stripe.Event {
    try {
      return this.stripeService.constructWebhookEvent(payload, signature);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Signature invalide";
      throw new BadRequestException(`Webhook Stripe invalide : ${message}`);
    }
  }

  async handleEvent(event: Stripe.Event): Promise<void> {
    if (!HANDLED_EVENTS.has(event.type)) {
      return;
    }

    switch (event.type) {
      case "checkout.session.completed":
        await this.handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case "invoice.paid":
        await this.handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;
      case "customer.subscription.updated":
        await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case "customer.subscription.deleted":
        await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
    }
  }

  private async handleCheckoutSessionCompleted(session: Stripe.Checkout.Session): Promise<void> {
    if (session.payment_status !== "paid") {
      return;
    }

    const metadata = session.metadata ?? {};
    const userId = metadata.user_id;
    const planIdRaw = metadata.plan_id;
    const sector = metadata.sector;

    if (!userId || !planIdRaw || !sector) {
      this.logger.warn(
        `checkout.session.completed ${session.id} : metadata incomplètes (user_id/plan_id/sector)`,
      );
      return;
    }

    const planIdParsed = billingPlanIdSchema.safeParse(planIdRaw);
    if (!planIdParsed.success) {
      this.logger.warn(
        `checkout.session.completed ${session.id} : plan_id invalide (${planIdRaw})`,
      );
      return;
    }

    const planId = planIdParsed.data;

    if (session.mode === "payment") {
      const creditsRaw = metadata.credits_amount;
      const creditsAmount = creditsRaw ? Number.parseInt(creditsRaw, 10) : NaN;
      if (!Number.isFinite(creditsAmount) || creditsAmount <= 0) {
        this.logger.warn(
          `checkout.session.completed ${session.id} : credits_amount invalide (${creditsRaw})`,
        );
        return;
      }

      await this.creditService.grantPackPurchase({
        userId,
        planId,
        sector,
        creditsAmount,
        stripeCheckoutSessionId: session.id,
      });
      return;
    }

    if (session.mode === "subscription" && session.subscription) {
      const subscriptionId =
        typeof session.subscription === "string"
          ? session.subscription
          : session.subscription.id;

      const subscription = await this.stripeService.retrieveSubscription(subscriptionId);
      await this.syncSubscriptionForUser(userId, subscription);
    }
  }

  private async handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
    const subscriptionId = this.getInvoiceSubscriptionId(invoice);
    if (!subscriptionId) {
      return;
    }

    const subscription = await this.stripeService.retrieveSubscription(subscriptionId);
    const customerId =
      typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;

    const billing = await this.userBillingRepo.findByStripeCustomerId(customerId);
    if (!billing) {
      this.logger.warn(`invoice.paid : client Stripe inconnu (${customerId})`);
      return;
    }

    await this.syncSubscriptionForUser(billing.userId, subscription);

    if (subscription.status === "active" && invoice.id) {
      const periodEnd = subscription.items.data[0]?.current_period_end;
      await this.creditService.grantSubscriptionPeriod({
        userId: billing.userId,
        stripeInvoiceId: invoice.id,
        periodEnd: periodEnd ? this.timestampToIso(periodEnd) : null,
        sector: subscription.metadata?.sector ?? null,
      });
    }
  }

  private async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
    const customerId =
      typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer.id;

    const billing = await this.userBillingRepo.findByStripeCustomerId(customerId);
    if (!billing) {
      this.logger.warn(`subscription.updated : client Stripe inconnu (${customerId})`);
      return;
    }

    await this.syncSubscriptionForUser(billing.userId, subscription);
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    const customerId =
      typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer.id;

    const billing = await this.userBillingRepo.findByStripeCustomerId(customerId);
    if (!billing) {
      return;
    }

    const periodEnd =
      this.timestampToIso(subscription.ended_at) ?? billing.subscriptionPeriodEnd;

    await this.userBillingRepo.updateSubscription({
      userId: billing.userId,
      activeSubscriptionId: null,
      subscriptionStatus: "canceled",
      subscriptionPeriodEnd: periodEnd,
    });

    if (periodEnd) {
      await this.creditService.revokeFreeLowPriceEntitlementIfExpiresAt(
        billing.userId,
        periodEnd,
      );
    }
  }

  private async syncSubscriptionForUser(
    userId: string,
    subscription: Stripe.Subscription,
  ): Promise<void> {
    const periodEnd = subscription.items.data[0]?.current_period_end;
    const status = subscription.status;

    await this.userBillingRepo.updateSubscription({
      userId,
      activeSubscriptionId: subscription.id,
      subscriptionStatus: status,
      subscriptionPeriodEnd: periodEnd ? this.timestampToIso(periodEnd) : null,
    });

    if (status === "active" && periodEnd) {
      const expiresAt = this.timestampToIso(periodEnd);
      if (expiresAt) {
        await this.creditService.grantFreeLowPriceEntitlementIfApplicable(
          userId,
          "platinum",
          expiresAt,
        );
      }
    }
  }

  private getInvoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
    const fromParent = invoice.parent?.subscription_details?.subscription;
    if (fromParent) {
      return typeof fromParent === "string" ? fromParent : fromParent.id;
    }

    const legacySubscription = this.readLegacyInvoiceSubscription(invoice);
    if (legacySubscription) {
      return legacySubscription;
    }

    return null;
  }

  /** Compatibilité API Stripe : champ `subscription` sur les factures d'abonnement. */
  private readLegacyInvoiceSubscription(invoice: Stripe.Invoice): string | null {
    const subscription = this.readInvoiceSubscriptionField(invoice);
    if (subscription === null || subscription === undefined) {
      return null;
    }

    if (typeof subscription === "string") {
      return subscription;
    }

    if (typeof subscription === "object" && "id" in subscription && typeof subscription.id === "string") {
      return subscription.id;
    }

    return null;
  }

  private readInvoiceSubscriptionField(
    invoice: Stripe.Invoice,
  ): string | Stripe.Subscription | null | undefined {
    if (!("subscription" in invoice)) {
      return null;
    }

    const value = invoice.subscription;
    if (typeof value === "string" || value === null || value === undefined) {
      return value;
    }

    if (typeof value === "object" && "id" in value) {
      return value as Stripe.Subscription;
    }

    return null;
  }

  private timestampToIso(timestamp: number | null | undefined): string | null {
    if (timestamp === null || timestamp === undefined) {
      return null;
    }
    return new Date(timestamp * 1000).toISOString();
  }
}
