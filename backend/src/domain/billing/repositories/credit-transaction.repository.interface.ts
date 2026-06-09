import type { CreditTransaction, CreditTransactionReason } from "../types/billing.types";

export type CreateCreditTransaction = {
  userId: string;
  lotId: string;
  delta: number;
  reason: CreditTransactionReason;
  metadata?: Record<string, unknown>;
};

export interface ICreditTransactionRepository {
  findRecentByUser(userId: string, accessToken: string, limit?: number): Promise<CreditTransaction[]>;
  createTransaction(data: CreateCreditTransaction): Promise<CreditTransaction>;
}

export const CREDIT_TRANSACTION_REPOSITORY = Symbol("ICreditTransactionRepository");
