import type { CreateCreditLot, CreditLot } from "../types/billing.types";

export interface ICreditLotRepository {
  findActiveLotsByUser(userId: string, accessToken: string): Promise<CreditLot[]>;
  findActiveLotsForDebitAdmin(userId: string): Promise<CreditLot[]>;
  findSignupGrantLot(userId: string): Promise<CreditLot | null>;
  findByStripeCheckoutSessionId(sessionId: string): Promise<CreditLot | null>;
  findByStripeInvoiceId(invoiceId: string): Promise<CreditLot | null>;
  createLot(data: CreateCreditLot): Promise<CreditLot>;
  decrementLotRemaining(lotId: string, amount: number): Promise<CreditLot>;
}

export const CREDIT_LOT_REPOSITORY = Symbol("ICreditLotRepository");
