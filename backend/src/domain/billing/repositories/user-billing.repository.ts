import { Injectable, InternalServerErrorException, Logger } from "@nestjs/common";
import { SupabaseService } from "../../../core/supabase/supabase.service";
import type { Database } from "../../../core/supabase/database.types";
import type {
  IUserBillingRepository,
  UpdateUserSubscription,
} from "./user-billing.repository.interface";
import type { UserBilling } from "../types/billing.types";

type UserBillingRow = Database["public"]["Tables"]["user_billing"]["Row"];

@Injectable()
export class UserBillingRepository implements IUserBillingRepository {
  private readonly logger = new Logger(UserBillingRepository.name);

  constructor(private readonly supabase: SupabaseService) {}

  async findByUserId(userId: string, accessToken: string): Promise<UserBilling | null> {
    const { data, error } = await this.supabase
      .forUser(accessToken)
      .from("user_billing")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      this.logger.error(`findByUserId(${userId}) failed`, error);
      throw new InternalServerErrorException("Échec de la récupération des informations de facturation");
    }

    return data ? this.toEntity(data as UserBillingRow) : null;
  }

  async findByUserIdAdmin(userId: string): Promise<UserBilling | null> {
    const { data, error } = await this.supabase.admin
      .from("user_billing")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      this.logger.error(`findByUserIdAdmin(${userId}) failed`, error);
      throw new InternalServerErrorException("Échec de la récupération des informations de facturation");
    }

    return data ? this.toEntity(data as UserBillingRow) : null;
  }

  async findByStripeCustomerId(stripeCustomerId: string): Promise<UserBilling | null> {
    const { data, error } = await this.supabase.admin
      .from("user_billing")
      .select("*")
      .eq("stripe_customer_id", stripeCustomerId)
      .maybeSingle();

    if (error) {
      this.logger.error(`findByStripeCustomerId(${stripeCustomerId}) failed`, error);
      throw new InternalServerErrorException("Échec de la recherche client Stripe");
    }

    return data ? this.toEntity(data as UserBillingRow) : null;
  }

  async upsertStripeCustomer(userId: string, stripeCustomerId: string): Promise<UserBilling> {
    const { data, error } = await this.supabase.admin
      .from("user_billing")
      .upsert(
        {
          user_id: userId,
          stripe_customer_id: stripeCustomerId,
        },
        { onConflict: "user_id" },
      )
      .select()
      .single();

    if (error) {
      this.logger.error(`upsertStripeCustomer(${userId}) failed`, error);
      throw new InternalServerErrorException("Échec de l'enregistrement du client Stripe");
    }

    return this.toEntity(data as UserBillingRow);
  }

  async updateSubscription(data: UpdateUserSubscription): Promise<UserBilling> {
    const { data: row, error } = await this.supabase.admin
      .from("user_billing")
      .upsert(
        {
          user_id: data.userId,
          active_subscription_id: data.activeSubscriptionId,
          subscription_status: data.subscriptionStatus,
          subscription_period_end: data.subscriptionPeriodEnd,
        },
        { onConflict: "user_id" },
      )
      .select()
      .single();

    if (error) {
      this.logger.error(`updateSubscription(${data.userId}) failed`, error);
      throw new InternalServerErrorException("Échec de la mise à jour de l'abonnement");
    }

    return this.toEntity(row as UserBillingRow);
  }

  private toEntity(row: UserBillingRow): UserBilling {
    return {
      userId: row.user_id,
      stripeCustomerId: row.stripe_customer_id,
      activeSubscriptionId: row.active_subscription_id,
      subscriptionStatus: row.subscription_status,
      subscriptionPeriodEnd: row.subscription_period_end,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
