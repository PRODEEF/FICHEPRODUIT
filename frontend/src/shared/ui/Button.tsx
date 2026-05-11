import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { useId } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router';

import { cn } from '../lib/cn';

type ButtonProps = {
  children: ReactNode;
  href?: string | undefined;
  onClick?: (() => void) | undefined;
  variant?:
    | 'primary'
    | 'secondary'
    | 'ghost'
    | 'gradient'
    | 'danger-outline'
    | 'neutral-outline'
    | undefined;
  size?: 'sm' | 'md' | 'lg' | undefined;
  glow?: boolean | undefined;
  className?: string | undefined;
  tooltip?: string | undefined;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'onClick'>;

const variantClasses: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'bg-purple-600 text-white hover:bg-purple-700',
  secondary: 'bg-white text-purple-600 border border-purple-600 hover:bg-purple-50',
  ghost: 'text-purple-600 underline hover:text-purple-800',
  gradient: 'border-0 bg-gradient-to-br from-purple-600 to-purple-500 text-white',
  'danger-outline':
    'border border-soft bg-transparent text-red-500 hover:border-red-500/35 hover:bg-red-50',
  'neutral-outline': 'border border-soft bg-bg-white text-text-primary hover:border-purple-400',
};

const sizeClasses: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'text-sm px-4 py-2 rounded-lg',
  md: 'text-base px-6 py-3 rounded-xl font-bold',
  lg: 'text-lg px-8 py-4 rounded-xl font-bold',
};

const tooltipBubbleClassName =
  'pointer-events-none absolute bottom-full left-1/2 z-10 mb-1.5 hidden w-max max-w-[min(18rem,calc(100vw-2rem))] -translate-x-1/2 rounded-md bg-gray-900 px-2.5 py-1.5 text-center text-xs leading-snug text-white shadow-md motion-safe:transition-opacity group-hover/btn-tooltip:block group-focus-within/btn-tooltip:block';

export function Button({
  children,
  href,
  onClick,
  variant = 'primary',
  size = 'md',
  glow = false,
  className,
  tooltip,
  type = 'button',
  ...buttonProps
}: ButtonProps) {
  const reactId = useId();
  const tooltipElementId = `btn-tooltip-${reactId.replace(/:/g, '')}`;
  const tooltipText = tooltip?.trim();
  const hasTooltip = Boolean(tooltipText);

  const prefersReduced =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const shouldGlow = glow && (variant === 'primary' || variant === 'secondary');
  const classes = cn(
    variantClasses[variant],
    sizeClasses[size],
    'inline-flex items-center justify-center transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60',
    className,
  );

  const describedBy = hasTooltip ? tooltipElementId : buttonProps['aria-describedby'];

  const core = href ? (
    <Link to={href} className={classes} aria-describedby={describedBy}>
      {children}
    </Link>
  ) : (
    <button
      type={type}
      className={classes}
      {...buttonProps}
      onClick={onClick}
      aria-describedby={describedBy}
    >
      {children}
    </button>
  );

  const withGlow = shouldGlow ? (
    <motion.div
      {...(!prefersReduced
        ? {
            animate: {
              boxShadow: [
                '0 0 30px rgba(124,58,237,0.3)',
                '0 0 70px rgba(124,58,237,0.6)',
                '0 0 30px rgba(124,58,237,0.3)',
              ],
            },
          }
        : {})}
      transition={{ duration: prefersReduced ? 0 : 2.5, repeat: Infinity, ease: 'easeInOut' }}
      className="inline-block rounded-xl"
    >
      {core}
    </motion.div>
  ) : (
    core
  );

  if (!hasTooltip) return withGlow;

  const isDisabled = Boolean(buttonProps.disabled);

  return (
    <span
      className={cn(
        'group/btn-tooltip relative inline-flex',
        isDisabled && !href && 'cursor-not-allowed',
      )}
      title={tooltipText}
    >
      {withGlow}
      <span id={tooltipElementId} role="tooltip" className={tooltipBubbleClassName}>
        {tooltipText}
      </span>
    </span>
  );
}
