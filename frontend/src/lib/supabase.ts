import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Supabase Auth (browser) — same project as the NestJS backend guard.
 *
 * Dashboard: Authentication → URL Configuration → Redirect URLs must include:
 * - http://localhost:5173/auth/reset-password (local Vite default)
 * - https://<your-production-host>/auth/reset-password
 *
 * `resetPasswordForEmail` uses redirectTo pointing at /auth/reset-password.
 */
let client: SupabaseClient | null = null

export function getSupabaseClient(): SupabaseClient | null {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
  if (!url?.trim() || !anonKey?.trim()) {
    return null
  }
  if (!client) {
    client = createClient(url, anonKey)
  }
  return client
}

export function getSupabaseClientOrThrow(): SupabaseClient {
  const c = getSupabaseClient()
  if (!c) {
    throw new Error(
      'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Copy frontend/.env.example to frontend/.env.',
    )
  }
  return c
}

/** Absolute URL for password recovery (hash tokens appended by Supabase). */
export function getPasswordResetRedirectUrl(): string {
  const base =
    (import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/$/, '') ??
    window.location.origin
  return `${base}/auth/reset-password`
}
