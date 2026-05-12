import type { InputHTMLAttributes } from 'react';

import { cn } from '../lib/cn';

type InputFieldProps = {
  id: string;
  label: string;
  error?: string | undefined;
  errorId?: string | undefined;
  containerClassName?: string | undefined;
  labelClassName?: string | undefined;
  inputClassName?: string | undefined;
  showCharacterCount?: boolean | undefined;
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'id'>;

export function InputField({
  id,
  label,
  error,
  errorId,
  containerClassName,
  labelClassName,
  inputClassName,
  showCharacterCount,
  ...inputProps
}: InputFieldProps) {
  const describedBy = error ? errorId : inputProps['aria-describedby'];
  const maxLen =
    typeof inputProps.maxLength === 'number' && inputProps.maxLength >= 0
      ? inputProps.maxLength
      : undefined;
  const rawLen =
    typeof inputProps.value === 'string'
      ? inputProps.value.length
      : typeof inputProps.defaultValue === 'string'
        ? inputProps.defaultValue.length
        : 0;

  return (
    <div className={cn('flex flex-col gap-1.5 text-left', containerClassName)}>
      <div className="flex items-center justify-between gap-2">
        <label
          htmlFor={id}
          className={cn(
            'text-xs font-semibold uppercase tracking-wide text-gray-500',
            labelClassName,
          )}
        >
          {label}
        </label>
        {showCharacterCount && maxLen !== undefined ? (
          <span className="whitespace-nowrap text-xs tabular-nums text-gray-400" aria-live="polite">
            {rawLen}/{maxLen}
          </span>
        ) : null}
      </div>
      <input
        id={id}
        className={cn(
          'w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-100 disabled:cursor-not-allowed disabled:opacity-70',
          error && 'border-red-500 ring-2 ring-red-100 focus:border-red-500 focus:ring-red-100',
          inputClassName,
        )}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        {...inputProps}
      />
      {error ? (
        <p id={errorId} className="m-0 text-sm text-red-500" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
