import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import type { FastifyReply, FastifyRequest } from "fastify";

/**
 * Format uniforme retourné pour toutes les erreurs HTTP.
 */
export interface ErrorResponse {
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp: string;
  path: string;
}

/**
 * Filtre global — intercepte TOUTES les exceptions (NestJS ou non) et
 * les sérialise dans un format JSON uniforme, compatible avec le client
 * frontend (nestHttpClient.ts attend { statusCode, message }).
 *
 * Enregistré via APP_FILTER dans AppModule.
 *
 * Comportement :
 * - HttpException NestJS → statusCode + message extraits proprement
 * - ZodValidationException (nestjs-zod) → 422 avec le tableau d'erreurs Zod
 * - Toute autre Error → 500 sans exposer le message interne en production
 */
@Catch()
export class AllHttpExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllHttpExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const reply = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();

    const { statusCode, message, errorCode } = this.extractStatus(exception);

    const isServerError = statusCode >= 500;

    if (isServerError) {
      this.logger.error(
        `[${request.method}] ${request.url} → ${statusCode}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    const body: ErrorResponse = {
      statusCode,
      message,
      error: errorCode,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    void reply.status(statusCode).send(body);
  }

  private extractStatus(exception: unknown): {
    statusCode: number;
    message: string | string[];
    errorCode: string;
  } {
    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const response = exception.getResponse();
      const defaultError = HttpStatus[statusCode] ?? "Error";

      if (typeof response === "string") {
        return { statusCode, message: response, errorCode: defaultError };
      }

      if (typeof response === "object" && response !== null) {
        const r = response as Record<string, unknown>;
        const customError = r["error"];
        const errorCode = typeof customError === "string" ? customError : defaultError;

        // ZodValidationPipe produit { message: string[] } ou { message: string }
        const msg = r["message"];
        if (typeof msg === "string") return { statusCode, message: msg, errorCode };
        if (Array.isArray(msg) && msg.every((m) => typeof m === "string")) {
          return { statusCode, message: msg as string[], errorCode };
        }

        return { statusCode, message: exception.message, errorCode };
      }

      return { statusCode, message: exception.message, errorCode: defaultError };
    }

    // Erreurs non-NestJS (Supabase SDK, réseau, AWS Bedrock, etc.)
    const isProduction = process.env["NODE_ENV"] === "production";
    const message = isProduction
      ? "Erreur interne du serveur"
      : exception instanceof Error
        ? exception.message
        : String(exception);

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message,
      errorCode: HttpStatus[HttpStatus.INTERNAL_SERVER_ERROR],
    };
  }
}
