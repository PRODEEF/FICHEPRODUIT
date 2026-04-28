export const USERNAME_MIN_LENGTH = 3
export const USERNAME_MAX_LENGTH = 30

/** Letters, digits, spaces, hyphens, underscores (no other punctuation). */
const USERNAME_REGEX = /^[a-zA-Z0-9_\- ]+$/

/** Returns a French validation error message, or null if valid. */
export function validateUsernameInput(trimmed: string): string | null {
  if (trimmed.length < USERNAME_MIN_LENGTH) {
    return `Le nom d’utilisateur doit contenir au moins ${USERNAME_MIN_LENGTH} caractères.`
  }
  if (trimmed.length > USERNAME_MAX_LENGTH) {
    return `Le nom d’utilisateur ne peut pas dépasser ${USERNAME_MAX_LENGTH} caractères.`
  }
  if (!USERNAME_REGEX.test(trimmed)) {
    return 'Utilise uniquement des lettres, des chiffres, des espaces, des tirets et des underscores.'
  }
  return null
}

/** Trims surrounding whitespace; casing is preserved (DB uniqueness is case-sensitive). */
export function normalizeUsername(raw: string): string {
  return raw.trim()
}
