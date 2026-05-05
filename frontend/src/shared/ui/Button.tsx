import type { ReactNode } from 'react';
import { Link } from 'react-router';

type ButtonProps = {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
};

const variantClasses: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'bg-purple-600 text-white hover:bg-purple-700',
  secondary: 'bg-white text-purple-600 border border-purple-600 hover:bg-purple-50',
  ghost: 'text-purple-600 underline hover:text-purple-800',
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
}: ButtonProps) {
  const className = `${variantClasses[variant]} ${sizeClasses[size]} transition-colors duration-200`;

  if (href) {
    return (
      <Link to={href} className={className}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {children}
    </button>
  );
}
