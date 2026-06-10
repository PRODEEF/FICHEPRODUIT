import type { UserEntitlement, UserEntitlementType } from "../types/billing.types";

export type CreateUserEntitlement = {
  userId: string;
  type: UserEntitlementType;
  expiresAt: string;
};

export interface IUserEntitlementRepository {
  findActiveByUser(userId: string, accessToken: string): Promise<UserEntitlement[]>;
  grantEntitlement(data: CreateUserEntitlement): Promise<UserEntitlement>;
  /** Révoque l'avantage actif uniquement si son `expires_at` correspond (ex. fin d'abonnement). */
  revokeActiveEntitlementIfExpiresAt(
    userId: string,
    type: UserEntitlementType,
    expiresAt: string,
  ): Promise<boolean>;
}

export const USER_ENTITLEMENT_REPOSITORY = Symbol("IUserEntitlementRepository");
