import type { SupabaseClient } from '@supabase/supabase-js';

import { authErrorMessage } from './authErrorMessage';

/** En cas d’échec, `code` sert au routage des erreurs par champ dans le formulaire. */
export type SignInWithEmailResult =
  | { ok: true }
  | { ok: false; message: string; code?: string };

export async function signInWithEmailPassword(
  supabase: SupabaseClient,
  email: string,
  password: string,
): Promise<SignInWithEmailResult> {
  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error)
    return { ok: false, message: authErrorMessage(error), code: error.code };
  return { ok: true };
}
