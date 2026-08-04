import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import type { FastifyRequest } from "fastify";
import type { AuthenticatedUser } from "../types/jwt-payload.types";

/**
 * Bloque l'accès aux ressources sensibles tant que l'utilisateur n'a pas
 * confirmé son e-mail dans Supabase. À enchaîner APRÈS `JwtGuard` afin que
 * `req.user` soit déjà peuplé — la vérification `emailConfirmedAt` s'appuie
 * sur ce champ typé `AuthenticatedUser`.
 */
@Injectable()
export class EmailVerifiedGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<FastifyRequest & { user?: AuthenticatedUser }>();

    const user = req.user;
    if (!user) {
      // Le guard est censé tourner après JwtGuard : `req.user` doit exister.
      // Ce cas signale une mauvaise composition côté controller.
      throw new UnauthorizedException("Authentification requise");
    }

    if (!user.emailConfirmedAt) {
      throw new ForbiddenException(
        "Confirmez votre adresse e-mail avant d'accéder à cette ressource.",
      );
    }

    return true;
  }
}
