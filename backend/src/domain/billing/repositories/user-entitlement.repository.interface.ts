import type { UserEntitlement, UserEntitlementType } from "../types/billing.types";

export type CreateUserEntitlement = {
  userId: string;
  type: UserEntitlementType;
  expiresAt: string;
};

export interface IUserEntitlementRepository {
  findActiveByUser(userId: string, accessToken: string): Promise<UserEntitlement[]>;
  grantEntitlement(data: CreateUserEntitlement): Promise<UserEntitlement>;
  revokeActiveByUserAndType(userId: string, type: UserEntitlementType): Promise<void>;
}

export const USER_ENTITLEMENT_REPOSITORY = Symbol("IUserEntitlementRepository");
