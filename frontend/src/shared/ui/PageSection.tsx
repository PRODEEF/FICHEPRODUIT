import type { HTMLAttributes } from 'react';

import { cn } from '../lib/utils/cn';

type PageSectionProps = HTMLAttributes<HTMLDivElement>;

export function PageSection({ className, ...props }: PageSectionProps) {
  return <div className={cn('relative z-[1] mx-auto w-full px-6 py-8', className)} {...props} />;
}
