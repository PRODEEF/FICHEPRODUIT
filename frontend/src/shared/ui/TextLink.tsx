import { Link, type LinkProps } from 'react-router';

import { cn } from '../lib/utils/cn';

type TextLinkProps = LinkProps & {
  className?: string;
};

export function TextLink({ className, ...props }: TextLinkProps) {
  return (
    <Link
      className={cn('font-semibold text-purple-600 no-underline hover:underline', className)}
      {...props}
    />
  );
}
