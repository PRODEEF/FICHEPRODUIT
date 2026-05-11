import type { HTMLAttributes } from 'react';

import { cn } from '../lib/cn';

type BadgeVariant = 'beta' | 'success' | 'warning' | 'error';

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

const variantClasses: Record<BadgeVariant, string> = {
  beta: 'bg-gradient-to-br from-purple-600 to-purple-400 text-white',
  success: 'bg-green-100 text-green-800',
  warning: 'bg-amber-100 text-amber-800',
  error: 'bg-red-100 text-red-800',
};

export function Badge({ variant = 'beta', className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-[0.65rem] font-bold',
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}
