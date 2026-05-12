import type { HTMLAttributes, ReactNode } from 'react';

import { cn } from '../lib/cn';

export type TagVariant = 'primary' | 'outlined' | 'muted' | 'soft';

type TagProps = Omit<HTMLAttributes<HTMLSpanElement>, 'children'> & {
  variant?: TagVariant | undefined;
  children: ReactNode;
  onDismiss?: (() => void) | undefined;
  dismissLabel?: string | undefined;
};

const variantClasses: Record<TagVariant, string> = {
  primary: 'border border-gray-200 bg-white text-gray-900 shadow-sm',
  outlined: 'border border-purple-600 bg-transparent text-purple-800',
  muted: 'border border-transparent bg-gray-100 text-gray-700',
  soft: 'border border-purple-100 bg-purple-50 text-purple-900',
};

export function Tag({
  variant = 'muted',
  children,
  onDismiss,
  dismissLabel = 'Retirer',
  className,
  ...props
}: TagProps) {
  return (
    <span
      className={cn(
        'group inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium',
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      {children}
      {onDismiss ? (
        <button
          type="button"
          className={cn(
            '-mr-0.5 rounded p-0.5 transition-opacity hover:text-gray-900',
            variant === 'outlined' && 'text-purple-600 hover:text-purple-900',
            variant === 'primary' && 'text-gray-500',
            variant === 'muted' && 'text-gray-500',
            variant === 'soft' && 'text-purple-600 hover:text-purple-900',
            'opacity-0 group-hover:opacity-100',
          )}
          onClick={(e) => {
            e.stopPropagation();
            onDismiss();
          }}
          aria-label={dismissLabel}
        >
          ×
        </button>
      ) : null}
    </span>
  );
}
