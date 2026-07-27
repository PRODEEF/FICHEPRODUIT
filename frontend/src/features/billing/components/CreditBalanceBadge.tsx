import { Coins } from 'lucide-react';

import { cn } from '@shared/lib/cn';
import { Badge } from '@shared/ui';

import { useBilling } from '../hooks/useBilling';

export interface CreditBalanceBadgeProps {
  className?: string;
}

export function CreditBalanceBadge({ className }: CreditBalanceBadgeProps) {
  const { summary, loading, error } = useBilling();

  if (loading && !summary) {
    return (
      <Badge variant="warning" className={cn('gap-1', className)} aria-busy="true">
        <Coins size={12} aria-hidden />…
      </Badge>
    );
  }

  if (error) {
    return (
      <Badge variant="warning" className={cn('gap-1 whitespace-nowrap', className)} title={error}>
        <Coins size={12} aria-hidden />
        Solde indisponible
      </Badge>
    );
  }

  if (!summary) return null;

  const label = summary.hasUnlimitedExports
    ? 'Illimité'
    : `${summary.balance} crédit${summary.balance > 1 ? 's' : ''}`;

  // Lien /pricing temporairement désactivé
  return (
    <Badge
      variant="success"
      className={cn('gap-1 whitespace-nowrap', className)}
      title="Solde de crédits"
    >
      <Coins size={12} aria-hidden />
      {label}
    </Badge>
  );
}
