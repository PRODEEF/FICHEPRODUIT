import { useState, type ChangeEvent } from 'react';
import { Eye, EyeOff } from 'lucide-react';

import { PasswordStrengthMeter } from './PasswordStrengthMeter';

const passwordToggleIconProps = {
  'aria-hidden': true as const,
  size: 20,
  strokeWidth: 1.5,
};

export type PasswordFieldProps = {
  id: string;
  label: string;
  name: string;
  autoComplete: string;
  required?: boolean;
  minLength?: number;
  placeholder?: string;
  value: string;
  onChange: (ev: ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  error?: string | null;
  /** Affiche l’indicateur de force (inscription, premier champ mot de passe). */
  showStrengthMeter?: boolean;
};

export function PasswordField({
  id,
  label,
  name,
  autoComplete,
  required,
  minLength,
  placeholder,
  value,
  onChange,
  disabled,
  error,
  showStrengthMeter = false,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const errorId = `${id}-error`;
  const strengthId = `${id}-strength`;
  const hasError = Boolean(error);
  const describedBy = [showStrengthMeter ? strengthId : '', hasError ? errorId : '']
    .filter(Boolean)
    .join(' ');

  return (
    <div className="auth-field">
      <label htmlFor={id}>{label}</label>
      <div className="auth-password-wrap">
        <input
          id={id}
          name={name}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          required={required}
          minLength={minLength}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          aria-invalid={hasError}
          aria-describedby={describedBy || undefined}
        />
        <button
          type="button"
          className="auth-password-toggle"
          onClick={() => setVisible((v) => !v)}
          disabled={disabled}
          aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
          aria-pressed={visible}
        >
          {visible ? <EyeOff {...passwordToggleIconProps} /> : <Eye {...passwordToggleIconProps} />}
        </button>
      </div>
      {showStrengthMeter ? (
        <PasswordStrengthMeter id={strengthId} password={value} />
      ) : null}
      {error ? (
        <p id={errorId} className="auth-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
