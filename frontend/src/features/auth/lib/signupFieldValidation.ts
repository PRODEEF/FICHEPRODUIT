import { parseAsSiteUrl } from '../../../lib/siteUrl';
import { normalizeUsername, validateUsernameInput } from '../../../lib/username';

export const MIN_PASSWORD_LENGTH = 8;

export function validatePasswordMatch(password: string, confirm: string): string | null {
  if (password !== confirm) {
    return 'Les mots de passe ne correspondent pas.';
  }
  return null;
}

export function validatePasswordMinLength(
  password: string,
  minLength = MIN_PASSWORD_LENGTH,
): string | null {
  if (password.length < minLength) {
    return `Le mot de passe doit contenir au moins ${minLength} caractères.`;
  }
  return null;
}

export type ValidatedUsername = { ok: true; normalized: string } | { ok: false; message: string };

export function validateUsernameForAuth(usernameRaw: string): ValidatedUsername {
  const normalized = normalizeUsername(usernameRaw);
  const err = validateUsernameInput(normalized);
  if (err) return { ok: false, message: err };
  return { ok: true, normalized };
}

export type OptionalWebsiteResult =
  | { ok: true; website_url: string }
  | { ok: false; message: string };

/**
 * Saisie vide → URL optionnelle conservée comme chaîne vide. Toute saisie non vide doit être une URL de site valide.
 */
export function parseOptionalWebsiteUrl(
  siteRaw: string,
  invalidMessage: string,
): OptionalWebsiteResult {
  const trimmed = siteRaw.trim();
  if (!trimmed) return { ok: true, website_url: '' };
  const parsed = parseAsSiteUrl(trimmed);
  if (!parsed) return { ok: false, message: invalidMessage };
  return { ok: true, website_url: parsed };
}
