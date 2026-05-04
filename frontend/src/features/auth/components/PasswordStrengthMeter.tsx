import { PASSWORD_MIN } from '../lib/authSchemas';
import {
  getPasswordStrengthLabel,
  getPasswordStrengthSnapshot,
  type PasswordStrengthLabel,
} from '../lib/passwordStrength';

export type PasswordStrengthMeterProps = {
  password: string;
  id?: string;
};

const STRENGTH_LABEL_TEXT: Record<Exclude<PasswordStrengthLabel, 'empty'>, string> = {
  weak: 'Faible',
  medium: 'Moyen',
  strong: 'Fort',
};

export function PasswordStrengthMeter({ password, id }: PasswordStrengthMeterProps) {
  const snapshot = getPasswordStrengthSnapshot(password, PASSWORD_MIN);
  const label = getPasswordStrengthLabel(snapshot);
  const levelText =
    label === 'empty' ? 'Indique la force de ton mot de passe.' : STRENGTH_LABEL_TEXT[label];

  return (
    <div id={id} className="auth-password-strength">
      <div
        className="auth-password-strength__bar"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={5}
        aria-valuenow={snapshot.filledCount}
        aria-label="Progression des critères de mot de passe"
      >
        {Array.from({ length: 5 }, (_, i) => (
          <span
            key={i}
            className={
              'auth-password-strength__segment' +
              (i < snapshot.filledCount ? ` auth-password-strength__segment--${label}` : '')
            }
          />
        ))}
      </div>
      <p className="auth-password-strength__label" aria-live="polite">
        {levelText}
      </p>
    </div>
  );
}
