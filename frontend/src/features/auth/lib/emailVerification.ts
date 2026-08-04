import type { User } from '@supabase/supabase-js';

/**
 * Indique si l’adresse e-mail Supabase a été confirmée.
 *
 * Repose sur `email_confirmed_at` (timestamp ISO renseigné après clic sur le lien de confirmation
 * envoyé par Supabase Auth). Retourne `false` pour un utilisateur nul/absent ou dont la
 * confirmation n’a pas encore été traitée par Supabase.
 */
export function isEmailVerified(user: User | null | undefined): boolean {
  return Boolean(user?.email_confirmed_at);
}
