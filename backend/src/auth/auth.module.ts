import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { OptionalSupabaseAuthGuard } from './optional-supabase-auth.guard';
import { SupabaseAuthGuard } from './supabase-auth.guard';
import { SupabaseService } from './supabase.service';

@Module({
  controllers: [AuthController],
  providers: [
    SupabaseService,
    SupabaseAuthGuard,
    OptionalSupabaseAuthGuard,
  ],
  exports: [
    SupabaseService,
    SupabaseAuthGuard,
    OptionalSupabaseAuthGuard,
  ],
})
export class AuthModule {}
