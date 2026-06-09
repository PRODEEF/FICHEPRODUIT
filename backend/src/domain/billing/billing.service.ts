import { Inject, Injectable } from "@nestjs/common";
import type { AuthenticatedUser } from "../../core/auth/types/jwt-payload.types";
import type { ShopSector } from "../shop/dto/shop-sector.schema";
import { BillingPricingService } from "./pricing/billing-pricing.service";
import { CreditService } from "./credit.service";
import {
  USER_BILLING_REPOSITORY,
  type IUserBillingRepository,
} from "./repositories/user-billing.repository.interface";
import { StripeService } from "./stripe.service";
import type { PublicPricingPlansResponse } from "./dto/billing-plans-response.dto";
import type { CheckoutPlanId } from "./dto/create-checkout.dto";
import type { BillingSummary } from "./types/billing.types";

@Injectable()
export class BillingService {
  constructor(
    private readonly creditService: CreditService,
    private readonly pricingService: BillingPricingService,
    private readonly stripeService: StripeService,
    @Inject(USER_BILLING_REPOSITORY)
    private readonly userBillingRepo: IUserBillingRepository,
  ) {}

  getPlans(sector: ShopSector): PublicPricingPlansResponse {
    return this.pricingService.getPublicPlansForSector(sector);
  }

  async getMe(user: AuthenticatedUser): Promise<BillingSummary> {
    return this.creditService.getBillingSummary(user);
  }

  async createCheckoutSession(
    user: AuthenticatedUser,
    planId: CheckoutPlanId,
    sector: ShopSector,
  ): Promise<{ url: string }> {
    const amountCents = this.pricingService.getCheckoutAmountCents(planId, sector);
    const creditsAmount = this.pricingService.getCreditsForPlan(planId);
    const planName = this.pricingService.getPlanDisplayName(planId);

    const billing = await this.userBillingRepo.findByUserId(user.id, user.accessToken);
    let customerId = billing?.stripeCustomerId ?? null;

    if (!customerId) {
      customerId = await this.stripeService.createCustomer(user.email, user.id);
      await this.userBillingRepo.upsertStripeCustomer(user.id, customerId);
    }

    const url = await this.stripeService.createBillingCheckoutSession({
      userId: user.id,
      customerId,
      planId,
      sector,
      planName,
      amountCents,
      creditsAmount,
      useFixedPlatinumPrice: this.pricingService.usesReferencePrice(sector),
    });

    return { url };
  }
}
