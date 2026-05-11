import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

@Injectable()
export class SupabaseService {
  // Client anon — RLS actives, scopé au JWT utilisateur
  private readonly anonClient: SupabaseClient<Database>;
  // Client service_role — bypass RLS, opérations admin uniquement
  private readonly adminClient: SupabaseClient<Database>;

  private readonly url: string;
  private readonly anonKey: string;

  constructor(private readonly config: ConfigService) {
    this.url = this.config.getOrThrow<string>("supabaseUrl");
    this.anonKey = this.config.getOrThrow<string>("supabaseAnonKey");
    const serviceKey = this.config.getOrThrow<string>("supabaseServiceRoleKey");

    this.anonClient = createClient<Database>(this.url, this.anonKey);
    this.adminClient = createClient<Database>(this.url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  /** Client scopé au JWT — RLS appliquées. À utiliser dans les Repositories. */
  forUser(accessToken: string): SupabaseClient<Database> {
    return createClient<Database>(this.url, this.anonKey, {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  /** Client anon — RLS appliquées, sans identité utilisateur. */
  get anon(): SupabaseClient<Database> {
    return this.anonClient;
  }

  /** Client admin — bypass RLS. Réservé aux opérations système (transfert guest→user, etc.). */
  get admin(): SupabaseClient<Database> {
    return this.adminClient;
  }

  /** Validation de token uniquement — pour le guard auth. */
  async getUser(accessToken: string) {
    const {
      data: { user },
      error,
    } = await this.anonClient.auth.getUser(accessToken);
    if (error || !user) return null;
    return user;
  }
}
