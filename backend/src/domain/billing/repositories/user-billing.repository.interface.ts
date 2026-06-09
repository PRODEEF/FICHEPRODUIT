import type { UserBilling } from "../types/billing.types";

export type UpdateUserSubscription = {
  userId: string;
  activeSubscriptionId: string | null;
  subscriptionStatus: string | null;
  subscriptionPeriodEnd: string | null;
};

export interface IUserBillingRepository {
  findByUserId(userId: string, accessToken: string): Promise<UserBilling | null>;
  findByStripeCustomerId(stripeCustomerId: string): Promise<UserBilling | null>;
  upsertStripeCustomer(userId: string, stripeCustomerId: string): Promise<UserBilling>;
  updateSubscription(data: UpdateUserSubscription): Promise<UserBilling>;
}

export const USER_BILLING_REPOSITORY = Symbol("IUserBillingRepository");
