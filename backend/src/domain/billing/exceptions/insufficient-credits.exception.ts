import { HttpException, HttpStatus } from "@nestjs/common";

/** Code d'erreur attendu par le client (`frontend/src/api/export.ts`). */
export const INSUFFICIENT_CREDITS_ERROR = "INSUFFICIENT_CREDITS";

/**
 * Levée lorsque l'utilisateur n'a pas assez de crédits pour un export.
 * HTTP 402 — le message contient le code métier pour le client.
 */
export class InsufficientCreditsException extends HttpException {
  constructor(
    message = "Crédits insuffisants pour cet export.",
  ) {
    super(
      {
        statusCode: HttpStatus.PAYMENT_REQUIRED,
        message: `${INSUFFICIENT_CREDITS_ERROR}: ${message}`,
        error: INSUFFICIENT_CREDITS_ERROR,
      },
      HttpStatus.PAYMENT_REQUIRED,
    );
  }
}
