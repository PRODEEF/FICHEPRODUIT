import { Controller, Get, UseGuards } from '@nestjs/common';
import { CurrentUser } from './decorators/current-user.decorator';
import { SupabaseAuthGuard } from './supabase-auth.guard';
import type { components } from '../generated/api';
import type { User } from '@supabase/supabase-js';

type UserProfile = components['schemas']['UserProfile'];

@Controller('auth')
export class AuthController {
  @Get('me')
  @UseGuards(SupabaseAuthGuard)
  getMe(@CurrentUser() user: User): UserProfile {
    return {
      id: user.id,
      email: user.email ?? '',
      created_at: user.created_at,
    };
  }
}
