import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import type { User } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';

/**
 * Sans en-tête Bearer : la requête est traitée comme invitée.
 * Avec Bearer : le JWT doit être valide (sinon 401), pour éviter de basculer silencieusement en mode invité.
 */
@Injectable()
export class OptionalSupabaseAuthGuard implements CanActivate {
  constructor(private readonly supabase: SupabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<
      FastifyRequest & { user?: User }
    >();
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return true;
    }
    const token = authHeader.slice(7);
    const user = await this.supabase.getUser(token);
    if (!user) {
      throw new UnauthorizedException('Invalid or expired token');
    }
    request.user = user;
    return true;
  }
}
