import type { CreateCreditLot, CreditLot } from "../types/billing.types";

export interface ICreditLotRepository {
  findRecentLotsByUser(userId: string, accessToken: string, limit?: number): Promise<CreditLot[]>;
  findActiveLotsByUser(userId: string, accessToken: string): Promise<CreditLot[]>;
  findSignupGrantLot(userId: string): Promise<CreditLot | null>;
  findByStripeCheckoutSessionId(sessionId: string): Promise<CreditLot | null>;
  findByStripeInvoiceId(invoiceId: string): Promise<CreditLot | null>;
  createLot(data: CreateCreditLot): Promise<CreditLot>;
  debitCreditsFifoAdmin(
    userId: string,
    amount: number,
    metadata: Record<string, unknown>,
  ): Promise<void>;
  refundExportDebitAdmin(userId: string, exportAttemptId: string): Promise<void>;
}

export const CREDIT_LOT_REPOSITORY = Symbol("ICreditLotRepository");
