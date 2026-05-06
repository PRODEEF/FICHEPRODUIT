import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router';

import { cn } from '../lib/utils/cn';

type ButtonProps = {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'gradient' | 'danger-outline' | 'neutral-outline';
  size?: 'sm' | 'md' | 'lg';
  glow?: boolean;
  className?: string;
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

export function Button({
  children,
  href,
  onClick,
  variant = 'primary',
  size = 'md',
  glow = false,
  className,
  type = 'button',
  ...buttonProps
}: ButtonProps) {
  const prefersReduced =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const shouldGlow = glow && (variant === 'primary' || variant === 'secondary');
  const classes = cn(
    variantClasses[variant],
    sizeClasses[size],
    'inline-flex items-center justify-center transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60',
    className,
  );

  const buttonContent = href ? (
    <Link to={href} className={classes}>
      {children}
    </Link>
  ) : (
    <button type={type} onClick={onClick} className={classes} {...buttonProps}>
      {children}
    </button>
  );

  if (!shouldGlow) return buttonContent;

  return (
    <motion.div
      animate={
        prefersReduced
          ? undefined
          : {
              boxShadow: [
                '0 0 30px rgba(124,58,237,0.3)',
                '0 0 70px rgba(124,58,237,0.6)',
                '0 0 30px rgba(124,58,237,0.3)',
              ],
            }
      }
      transition={{ duration: prefersReduced ? 0 : 2.5, repeat: Infinity, ease: 'easeInOut' }}
      className="rounded-xl inline-block"
    >
      {buttonContent}
    </motion.div>
  );
}
