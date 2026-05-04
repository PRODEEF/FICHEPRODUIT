import type { SupabaseClient } from '@supabase/supabase-js';
import { authErrorMessage } from './authErrorMessage';

export type SignInWithEmailResult = { ok: true } | { ok: false; message: string };

export async function signInWithEmailPassword(
  supabase: SupabaseClient,
  email: string,
  password: string,
): Promise<SignInWithEmailResult> {
  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error) return { ok: false, message: authErrorMessage(error) };
  return { ok: true };
}
