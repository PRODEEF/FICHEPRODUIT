import type { HTMLAttributes } from 'react';

import { cn } from '../lib/utils/cn';

type CardProps = HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-soft bg-bg-white p-8 shadow-[0_4px_24px_rgba(0,0,0,0.06)]',
        className,
      )}
      {...props}
    />
  );
}
