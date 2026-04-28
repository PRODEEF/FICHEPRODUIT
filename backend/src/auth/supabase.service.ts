import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private readonly client: SupabaseClient;
  private readonly supabaseUrl: string;
  private readonly supabaseAnonKey: string;

  constructor(private readonly configService: ConfigService) {
    const url = this.configService.get<string>('supabaseUrl');
    const anonKey = this.configService.get<string>('supabaseAnonKey');
    if (!url || !anonKey) {
      throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY must be set');
    }
    this.supabaseUrl = url;
    this.supabaseAnonKey = anonKey;
    this.client = createClient(url, anonKey);
  }

  async getUser(accessToken: string): Promise<User | null> {
    const {
      data: { user },
      error,
    } = await this.client.auth.getUser(accessToken);
    if (error || !user) {
      return null;
    }
    return user;
  }

  getClient(): SupabaseClient {
    return this.client;
  }

  /**
   * PostgREST client scoped to the end-user JWT. RLS policies (e.g. auth.uid() = user_id) apply.
   */
  getClientForAccessToken(accessToken: string): SupabaseClient {
    return createClient(this.supabaseUrl, this.supabaseAnonKey, {
      global: {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
}
