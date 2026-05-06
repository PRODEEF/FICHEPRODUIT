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
    label === 'empty'
      ? 'Le niveau de sécurité de votre mot de passe apparaît au fil de la saisie.'
      : STRENGTH_LABEL_TEXT[label];

  return (
    <div id={id} className="mt-1 flex flex-col gap-2">
      <div
        className="flex w-full gap-1"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={5}
        aria-valuenow={snapshot.filledCount}
        aria-label="Progression des critères de mot de passe"
      >
        {Array.from({ length: 5 }, (_, i) => (
          <span
            key={i}
            className={`h-1 flex-1 rounded ${
              i < snapshot.filledCount
                ? label === 'weak'
                  ? 'bg-red-500/55'
                  : label === 'medium'
                    ? 'bg-amber-600/70'
                    : 'bg-purple-500'
                : 'bg-soft'
            }`}
          />
        ))}
      </div>
      <p className="m-0 text-xs font-semibold text-text-secondary" aria-live="polite">
        {levelText}
      </p>
    </div>
  );
}
