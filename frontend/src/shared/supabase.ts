import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Browser Supabase client
 */
let client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (
    url === undefined ||
    anonKey === undefined ||
    url.trim() === '' ||
    anonKey.trim() === ''
  ) {
    return null;
  }
  client ??= createClient(url, anonKey);

  return client;
}

export function getSupabaseClientOrThrow(): SupabaseClient {
  const c = getSupabaseClient();
  if (!c)
    throw new Error(
      'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Copy frontend/.env.example to frontend/.env.',
    );
  return c;
}
