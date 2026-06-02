import { ChevronDown } from 'lucide-react';
import type { ReactNode, SelectHTMLAttributes } from 'react';

import { cn } from '../lib/cn';

type SelectFieldProps = {
  id: string;
  label: string;
  error?: string | undefined;
  errorId?: string | undefined;
  containerClassName?: string | undefined;
  labelClassName?: string | undefined;
  selectClassName?: string | undefined;
  children: ReactNode;
} & Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id' | 'children'>;

export function SelectField({
  id,
  label,
  error,
  errorId,
  containerClassName,
  labelClassName,
  selectClassName,
  children,
  ...selectProps
}: SelectFieldProps) {
  const describedBy = error ? errorId : selectProps['aria-describedby'];

  return (
    <div className={cn('flex flex-col gap-1.5 text-left', containerClassName)}>
      <label
        htmlFor={id}
        className={cn(
          'text-xs font-semibold uppercase tracking-wide text-gray-500',
          labelClassName,
        )}
      >
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          className={cn(
            'w-full appearance-none rounded-xl border border-gray-200 bg-white py-2.5 pl-3 pr-9 text-sm text-gray-900 outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-100 disabled:cursor-not-allowed disabled:opacity-70',
            error && 'border-red-500 ring-2 ring-red-100 focus:border-red-500 focus:ring-red-100',
            selectClassName,
          )}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          {...selectProps}
        >
          {children}
        </select>
        <ChevronDown
          className="pointer-events-none absolute top-1/2 right-[3px] h-4 w-4 -translate-y-1/2 text-gray-500"
          aria-hidden
        />
      </div>
      {error ? (
        <p id={errorId} className="m-0 text-sm text-red-500" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
