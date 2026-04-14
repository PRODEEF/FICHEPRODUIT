import type { AuthError } from '@supabase/supabase-js'

const KNOWN: Record<string, string> = {
  invalid_credentials:
    'E-mail ou mot de passe incorrect. Vérifie tes identifiants.',
  invalid_grant: 'E-mail ou mot de passe incorrect. Vérifie tes identifiants.',
  email_not_confirmed:
    'Confirme ton adresse e-mail avant de te connecter (lien dans ta boîte de réception).',
  user_already_registered:
    'Un compte existe déjà avec cette adresse e-mail. Connecte-toi ou réinitialise ton mot de passe.',
  weak_password: 'Mot de passe trop faible. Choisis un mot de passe plus long.',
  same_password: 'Le nouveau mot de passe doit être différent de l’ancien.',
  over_request_rate_limit:
    'Trop de tentatives. Réessaie dans quelques minutes.',
}

/** Maps Supabase Auth errors to French UI copy. */
export function authErrorMessage(error: AuthError | null): string {
  if (!error) return 'Une erreur est survenue. Réessaie.'
  const code = error.code?.toLowerCase() ?? ''
  if (code && KNOWN[code]) return KNOWN[code]
  const msg = error.message?.trim()
  if (msg) return msg
  return 'Une erreur est survenue. Réessaie.'
}
