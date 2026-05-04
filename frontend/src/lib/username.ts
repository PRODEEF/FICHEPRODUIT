export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 30;

const USERNAME_REGEX = /^[a-zA-Z0-9_\- ]+$/;

/** Message d’erreur de validation en français, ou `null` si la valeur est valide. */
export function validateUsernameInput(trimmed: string): string | null {
  if (trimmed.length < USERNAME_MIN_LENGTH) {
    return `Le nom d’utilisateur doit contenir au moins ${USERNAME_MIN_LENGTH} caractères.`;
  }
  if (trimmed.length > USERNAME_MAX_LENGTH) {
    return `Le nom d’utilisateur ne peut pas dépasser ${USERNAME_MAX_LENGTH} caractères.`;
  }
  if (!USERNAME_REGEX.test(trimmed)) {
    return 'Utilise uniquement des lettres, des chiffres, des espaces, des tirets et des underscores.';
  }
  return null;
}

/** Supprime les espaces en tête et fin ; la casse est conservée (unicité en base sensible à la casse). */
export function normalizeUsername(raw: string): string {
  return raw.trim();
}
