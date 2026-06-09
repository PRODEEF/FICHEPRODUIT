import { INSUFFICIENT_CREDITS_ERROR } from "./insufficient-credits.exception";

/** Erreur levée par le débit FIFO atomique quand le solde est insuffisant. */
export class InsufficientCreditsDebitError extends Error {
  readonly available: number;

  constructor(available: number) {
    super(INSUFFICIENT_CREDITS_ERROR);
    this.name = "InsufficientCreditsDebitError";
    this.available = available;
  }
}
