import { forgotPasswordSchema } from './authSchemas';

/** Valide et normalise un e-mail issu d’un query param `?email=`. */
export function parseAuthEmailFromQuery(raw: string | null): string | null {
  if (raw === null) return null;
  const result = forgotPasswordSchema.shape.email.safeParse(raw.trim());
  return result.success ? result.data : null;
}

/** Suffixe de query `?email=...` si l’e-mail est valide, sinon chaîne vide. */
export function buildAuthEmailQuery(email: string): string {
  const parsed = parseAuthEmailFromQuery(email);
  if (!parsed) return '';
  return `?email=${encodeURIComponent(parsed)}`;
}
