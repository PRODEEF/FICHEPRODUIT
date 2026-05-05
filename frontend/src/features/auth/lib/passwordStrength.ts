const LOWER = /[a-z]/;
const UPPER = /[A-Z]/;
const DIGIT = /\d/;
const SPECIAL = /[^A-Za-z0-9]/;

export const SIGNUP_PASSWORD_COMPLEXITY_MESSAGE =
  'Réponds à au moins quatre critères sur cinq : 8 caractères, minuscule, majuscule, chiffre et symbole.';

export type PasswordStrengthSnapshot = {
  lengthOk: boolean;
  lowercase: boolean;
  uppercase: boolean;
  digit: boolean;
  special: boolean;
  filledCount: number;
  isAcceptable: boolean;
};

/**
 * Analyse la force du mot de passe pour l’UI et la validation d’inscription.
 *
 * @param password - Valeur brute du champ (sans trim : le mot de passe peut intentionnellement contenir des espaces).
 * @param minLength - Longueur minimale ; doit correspondre à `PASSWORD_MIN` du schéma d’auth.
 */
export function getPasswordStrengthSnapshot(
  password: string,
  minLength: number,
): PasswordStrengthSnapshot {
  const lengthOk = password.length >= minLength;
  const lowercase = LOWER.test(password);
  const uppercase = UPPER.test(password);
  const digit = DIGIT.test(password);
  const special = SPECIAL.test(password);

  const filledCount =
    (lengthOk ? 1 : 0) +
    (lowercase ? 1 : 0) +
    (uppercase ? 1 : 0) +
    (digit ? 1 : 0) +
    (special ? 1 : 0);

  const isAcceptable = filledCount >= 4;

  return {
    lengthOk,
    lowercase,
    uppercase,
    digit,
    special,
    filledCount,
    isAcceptable,
  };
}

export type PasswordStrengthLabel = 'empty' | 'weak' | 'medium' | 'strong';

/**
 * Libellé de force pour l’UI : « Fort » lorsque le mot de passe est accepté à l’inscription
 * (au moins 4 critères sur 5, voir {@link PasswordStrengthSnapshot.isAcceptable}).
 */
export function getPasswordStrengthLabel(
  snapshot: PasswordStrengthSnapshot,
): PasswordStrengthLabel {
  if (snapshot.filledCount === 0) return 'empty';
  if (snapshot.isAcceptable) return 'strong';
  if (snapshot.filledCount <= 2) return 'weak';
  return 'medium';
}
