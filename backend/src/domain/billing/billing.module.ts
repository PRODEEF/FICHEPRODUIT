import { Module } from "@nestjs/common";
import { AuthModule } from "../../core/auth/auth.module";
import { BillingController } from "./billing.controller";
import { BillingService } from "./billing.service";
import { CreditGrantService } from "./credit-grant.service";
import { CreditLedgerService } from "./credit-ledger.service";
import { CreditService } from "./credit.service";
import { StripeWebhookController } from "./stripe-webhook.controller";
import { StripeWebhookService } from "./stripe-webhook.service";
import { BillingPricingService } from "./pricing/billing-pricing.service";
import { StripeService } from "./stripe.service";
import { CreditLotRepository } from "./repositories/credit-lot.repository";
import { CREDIT_LOT_REPOSITORY } from "./repositories/credit-lot.repository.interface";
import { CreditTransactionRepository } from "./repositories/credit-transaction.repository";
import { CREDIT_TRANSACTION_REPOSITORY } from "./repositories/credit-transaction.repository.interface";
import { UserBillingRepository } from "./repositories/user-billing.repository";
import { USER_BILLING_REPOSITORY } from "./repositories/user-billing.repository.interface";
import { UserEntitlementRepository } from "./repositories/user-entitlement.repository";
import { USER_ENTITLEMENT_REPOSITORY } from "./repositories/user-entitlement.repository.interface";

@Module({
  imports: [AuthModule],
  controllers: [BillingController, StripeWebhookController],
  providers: [
    BillingService,
    CreditService,
    CreditLedgerService,
    CreditGrantService,
    StripeWebhookService,
    StripeService,
    BillingPricingService,
    {
      provide: CREDIT_LOT_REPOSITORY,
      useClass: CreditLotRepository,
    },
    {
      provide: CREDIT_TRANSACTION_REPOSITORY,
      useClass: CreditTransactionRepository,
    },
    {
      provide: USER_BILLING_REPOSITORY,
      useClass: UserBillingRepository,
    },
    {
      provide: USER_ENTITLEMENT_REPOSITORY,
      useClass: UserEntitlementRepository,
    },
  ],
  exports: [CreditService, StripeService],
})
export class BillingModule {}
