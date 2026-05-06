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
    <div className="flex flex-col gap-1.5 text-left">
      <label htmlFor={id} className="text-sm font-semibold text-text-secondary">
        {label}
      </label>
      <div className="relative w-full">
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
          className="w-full rounded-xl border border-soft bg-bg-white px-3 py-2.5 pr-11 text-sm text-text-primary outline-none transition focus:border-purple-400 focus:shadow-[0_0_0_3px_rgba(139,92,246,0.15)] disabled:cursor-not-allowed disabled:opacity-70 aria-[invalid=true]:border-red-500 aria-[invalid=true]:shadow-[0_0_0_3px_rgba(239,68,68,0.18)]"
        />
        <button
          type="button"
          className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg border-0 bg-transparent p-0 text-text-muted hover:text-purple-600 disabled:cursor-not-allowed disabled:opacity-50"
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
        <p id={errorId} className="m-0 text-sm text-red-500" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
