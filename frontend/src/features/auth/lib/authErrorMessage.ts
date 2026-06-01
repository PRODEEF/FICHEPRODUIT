import type { AuthError, User } from '@supabase/supabase-js';

export const SIGNUP_EMAIL_ALREADY_MESSAGE = 'Cette adresse e-mail est déjà utilisée.';

const KNOWN: Record<string, string> = {
  invalid_credentials: 'E-mail ou mot de passe incorrect. Vérifiez vos identifiants.',
  invalid_grant: 'E-mail ou mot de passe incorrect. Vérifiez vos identifiants.',
  email_not_confirmed:
    'Confirmez votre adresse e-mail avant de vous connecter (lien dans votre boîte de réception).',
  user_already_registered: SIGNUP_EMAIL_ALREADY_MESSAGE,
  weak_password:
    'Mot de passe trop faible. Choisissez un mot de passe plus long et ajoutez des caractères spéciaux.',
  same_password: 'Le nouveau mot de passe doit être différent de l’ancien.',
  over_request_rate_limit: 'Trop de tentatives. Réessayez dans quelques minutes.',
  unexpected_failure:
    'Erreur serveur lors de la création du compte. Consultez les logs Postgres dans le Dashboard Supabase (voir README, section dépannage inscription).',
};

const DATABASE_SIGNUP_HINT =
  'La création du compte a échoué côté base de données. ' +
  'Si les logs Postgres mentionnent `public.profiles`, exécutez le script `supabase/scripts/repair_signup_users.sql` dans le SQL Editor Supabase (ancien trigger à supprimer). ' +
  'Sinon : migrations non appliquées ou table `public.users` absente — voir le README, section dépannage inscription.';

const EMAIL_ALREADY_REGISTERED_MESSAGE_RE =
  /user already registered|already registered|email.*already|déjà.*(utilisé|enregistré|existe)/i;

/** Erreur ou réponse signUp indiquant un e-mail déjà inscrit (codes et messages Supabase variables). */
export function isSignupEmailAlreadyRegisteredError(error: AuthError | null): boolean {
  if (!error) return false;
  const code = error.code?.toLowerCase() ?? '';
  if (
    code === 'user_already_registered' ||
    code === 'email_exists' ||
    code === 'email_already_in_use' ||
    code === 'user_exists'
  ) {
    return true;
  }
  const message = error.message?.trim() ?? '';
  return EMAIL_ALREADY_REGISTERED_MESSAGE_RE.test(message);
}

/**
 * Cas sans erreur HTTP : confirmation e-mail activée, Supabase renvoie un user factice
 * avec `identities` vide pour éviter l’énumération d’e-mails.
 */
export function isSignupDuplicateEmailUser(user: User | null | undefined): boolean {
  if (!user) return false;
  return (user.identities?.length ?? 0) === 0;
}

/** Message court pour l’interface à partir d’une erreur Auth Supabase. */
export function authErrorMessage(error: AuthError | null): string {
  if (!error) return 'Une erreur inconnue est survenue. Réessayez.';

  const message = error.message?.trim() ?? '';
  if (/database error saving new user/i.test(message)) {
    return DATABASE_SIGNUP_HINT;
  }

  if (isSignupEmailAlreadyRegisteredError(error)) {
    return SIGNUP_EMAIL_ALREADY_MESSAGE;
  }

  if (!error.code) {
    return message !== '' ? message : 'Une erreur inconnue est survenue. Réessayez.';
  }

  const code = error.code.toLowerCase();
  if (KNOWN[code]) return KNOWN[code];

  return message !== '' ? message : 'Une erreur inconnue est survenue. Réessayez.';
}
