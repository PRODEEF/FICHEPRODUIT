import type { SupabaseClient } from '@supabase/supabase-js';

import { authErrorMessage } from './authErrorMessage';

/**
 * Absolute return URL after sending the reset email (Supabase appends tokens in the hash).
 *
 * Supabase Dashboard → Authentication → URL Configuration → Redirect URLs should include e.g.:
 * - `http://localhost:5173/auth/reset-password` (default Vite dev);
 * - `https://<production-host>/auth/reset-password`.
 */
export function getPasswordResetRedirectUrl(): string {
  const base =
    (import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/$/, '') ??
    window.location.origin;
  return `${base}/auth/reset-password`;
}

export type RequestResetResult = { ok: true } | { ok: false; message: string };

/**
 * Sends the Supabase recovery email; `redirectTo` must be an absolute URL allowed on the project.
 */
export async function requestPasswordResetEmail(
  supabase: SupabaseClient,
  email: string,
  redirectTo: string,
): Promise<RequestResetResult> {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo,
  });
  if (error) return { ok: false, message: authErrorMessage(error) };
  return { ok: true };
}

export type UpdatePasswordResult = { ok: true } | { ok: false; message: string };

/**
 * Applies the new password then ends the local session (`signOut`).
 */
export async function updatePasswordAndSignOut(
  supabase: SupabaseClient,
  password: string,
): Promise<UpdatePasswordResult> {
  const { error: updateError } = await supabase.auth.updateUser({ password });
  if (updateError) {
    return { ok: false, message: authErrorMessage(updateError) };
  }
  await supabase.auth.signOut();
  return { ok: true };
}
