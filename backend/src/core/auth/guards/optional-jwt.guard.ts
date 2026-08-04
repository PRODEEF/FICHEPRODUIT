import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { FastifyRequest } from "fastify";
import { extractBearerToken } from "../extract-bearer-token";
import { SupabaseService } from "../../supabase/supabase.service";
import type { AuthenticatedUser } from "../types/jwt-payload.types";

@Injectable()
export class OptionalJwtGuard implements CanActivate {
  constructor(private readonly supabase: SupabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<FastifyRequest & { user?: AuthenticatedUser }>();
    const token = extractBearerToken(req);

    if (!token) return true;

    const user = await this.supabase.getUser(token);
    // Token invalide/expiré : on ignore et on laisse passer en anonyme (parcours invité)
    if (!user) return true;

    req.user = {
      id: user.id,
      email: user.email ?? "",
      accessToken: token,
      emailConfirmedAt: user.email_confirmed_at ?? null,
    };
    return true;
  }
}
