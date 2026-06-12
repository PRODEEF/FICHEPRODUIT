import type { AuthError, SupabaseClient } from '@supabase/supabase-js';

import { authErrorMessage } from './authErrorMessage';
import { clearPasswordRecoveryIntent } from './passwordRecoveryGate';

/**
 * Absolute return URL after sending the reset email (Supabase appends tokens in the hash).
 *
 * Supabase Dashboard → Authentication → URL Configuration → Redirect URLs should include e.g.:
 * - `http://localhost:5173/auth/reset-password` (default Vite dev);
 * - `https://<production-host>/auth/reset-password`.
 */
export function getPasswordResetRedirectUrl(): string {
  const siteUrl = import.meta.env.VITE_SITE_URL;
  const fromEnv =
    siteUrl !== undefined && siteUrl.trim() !== '' ? siteUrl.replace(/\/$/, '').trim() : '';
  const base = fromEnv !== '' ? fromEnv : window.location.origin;
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

const CURRENT_PASSWORD_INCORRECT_MESSAGE = 'Mot de passe actuel incorrect.';

function isCurrentPasswordVerificationError(error: AuthError): boolean {
  const code = error.code?.toLowerCase() ?? '';
  return code === 'invalid_credentials' || code === 'invalid_grant';
}

/** Met à jour le mot de passe sans déconnecter (profil connecté). */
export async function updatePassword(
  supabase: SupabaseClient,
  password: string,
): Promise<UpdatePasswordResult> {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { ok: false, message: authErrorMessage(error) };
  return { ok: true };
}

/**
 * Vérifie l’ancien mot de passe puis applique le nouveau (utilisateur connecté).
 */
export async function changePasswordWithVerification(
  supabase: SupabaseClient,
  email: string,
  currentPassword: string,
  newPassword: string,
): Promise<UpdatePasswordResult> {
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password: currentPassword,
  });
  if (signInError) {
    const message = isCurrentPasswordVerificationError(signInError)
      ? CURRENT_PASSWORD_INCORRECT_MESSAGE
      : authErrorMessage(signInError);
    return { ok: false, message };
  }
  return updatePassword(supabase, newPassword);
}

/**
 * Applique le nouveau mot de passe après lien recovery en conservant la session.
 */
export async function completePasswordRecovery(
  supabase: SupabaseClient,
  password: string,
): Promise<UpdatePasswordResult> {
  const result = await updatePassword(supabase, password);
  if (!result.ok) return result;
  clearPasswordRecoveryIntent();
  return { ok: true };
}

/**
 * Applique le nouveau mot de passe puis termine la session locale (`signOut`).
 */
export async function updatePasswordAndSignOut(
  supabase: SupabaseClient,
  password: string,
): Promise<UpdatePasswordResult> {
  const result = await updatePassword(supabase, password);
  if (!result.ok) return result;
  await supabase.auth.signOut();
  clearPasswordRecoveryIntent();
  return { ok: true };
}
