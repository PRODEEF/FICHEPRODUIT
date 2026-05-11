import type { AuthError } from '@supabase/supabase-js';

const KNOWN: Record<string, string> = {
  invalid_credentials: 'E-mail ou mot de passe incorrect. Vérifiez vos identifiants.',
  invalid_grant: 'E-mail ou mot de passe incorrect. Vérifiez vos identifiants.',
  email_not_confirmed:
    'Confirmez votre adresse e-mail avant de vous connecter (lien dans votre boîte de réception).',
  user_already_registered:
    'Un compte existe déjà avec cette adresse e-mail. Connectez-vous ou réinitialisez votre mot de passe.',
  weak_password:
    'Mot de passe trop faible. Choisissez un mot de passe plus long et ajoutez des caractères spéciaux.',
  same_password: 'Le nouveau mot de passe doit être différent de l’ancien.',
  over_request_rate_limit: 'Trop de tentatives. Réessayez dans quelques minutes.',
};

/** Message court pour l’interface à partir d’une erreur Auth Supabase. */
export function authErrorMessage(error: AuthError | null): string {
  if (!error?.code) return 'Une erreur inconnue est survenue. Réessayez.';

  const code = error.code.toLowerCase();
  if (KNOWN[code]) return KNOWN[code];

  return error.message.trim();
}
