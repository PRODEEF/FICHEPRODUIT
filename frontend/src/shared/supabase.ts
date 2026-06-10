import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Browser Supabase client
 */
let client: SupabaseClient | null = null;

/** Indique si les variables VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY sont renseignées. */
export function isSupabaseConfigured(): boolean {
  return getSupabaseClient() !== null;
}

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
  if (client === null) {
    client = createClient(url, anonKey, {
      auth: {
        detectSessionInUrl: true,
        persistSession: true,
        flowType: 'pkce',
      },
    });
  }

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
