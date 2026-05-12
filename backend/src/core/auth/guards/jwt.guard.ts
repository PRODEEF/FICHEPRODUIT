import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { FastifyRequest } from "fastify";
import { extractBearerToken } from "../extract-bearer-token";
import { SupabaseService } from "../../supabase/supabase.service";
import type { AuthenticatedUser } from "../types/jwt-payload.types";

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(private readonly supabase: SupabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<FastifyRequest>();
    const token = extractBearerToken(req);

    if (!token) throw new UnauthorizedException("Missing token");

    const user = await this.supabase.getUser(token);
    if (!user) throw new UnauthorizedException("Invalid or expired token");

    (req as FastifyRequest & { user: AuthenticatedUser }).user = {
      id: user.id,
      email: user.email ?? "",
      accessToken: token,
    };
    return true;
  }
}
