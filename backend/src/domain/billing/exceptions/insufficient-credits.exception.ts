import { HttpException, HttpStatus } from "@nestjs/common";

/** Code d'erreur métier pour crédits insuffisants (`INSUFFICIENT_CREDITS`). */
export const INSUFFICIENT_CREDITS_ERROR = "INSUFFICIENT_CREDITS";

export type InsufficientCreditsBody = {
  statusCode: number;
  message: string;
  error: typeof INSUFFICIENT_CREDITS_ERROR;
  required: number;
  available: number;
};

/**
 * Levée lorsque l'utilisateur n'a pas assez de crédits pour un export.
 * HTTP 402 — le message contient le code métier pour le client.
 */
export class InsufficientCreditsException extends HttpException {
  constructor(
    required: number,
    available: number,
    message = "Crédits insuffisants pour cet export.",
  ) {
    const body: InsufficientCreditsBody = {
      statusCode: HttpStatus.PAYMENT_REQUIRED,
      message: `${INSUFFICIENT_CREDITS_ERROR}: ${message}`,
      error: INSUFFICIENT_CREDITS_ERROR,
      required,
      available,
    };
    super(body, HttpStatus.PAYMENT_REQUIRED);
  }
}
