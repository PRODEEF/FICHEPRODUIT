import { Check } from 'lucide-react';

import { cn } from '@shared/lib/cn';
import { Badge, Button } from '@shared/ui';

import type { BillingPlanId } from '@api/types/api.types';

import type { ComputedPlan } from '../types';
import { PRICE_EXCL_TAX_LABEL } from '../lib/pricingConstants';
import { formatPriceEur } from '../lib/pricingFormat';

interface PricingPlanCardProps {
  plan: ComputedPlan;
  isAuthenticated: boolean;
  checkoutLoading: boolean;
  onSelectPlan: (planId: BillingPlanId) => void;
}

export function PricingPlanCard({
  plan,
  isAuthenticated,
  checkoutLoading,
  onSelectPlan,
}: PricingPlanCardProps) {
  const priceDecimals = plan.priceEur % 1 === 0 ? 0 : 2;
  const isBusinessCustom = plan.id === 'business_custom';

  return (
    <article
      className={cn(
        'relative flex h-full w-full min-w-0 flex-col rounded-2xl border bg-white p-4 shadow-[0_4px_24px_rgba(0,0,0,0.06)] sm:p-5',
        plan.recommended ? 'border-2 border-purple-500' : 'border-soft',
      )}
    >
      {plan.recommended ? (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap">
          Recommandé
        </Badge>
      ) : null}

      <p className="mb-2 text-[0.65rem] font-bold tracking-wide text-text-muted sm:text-xs">
        {plan.name}
      </p>
      <p className="text-2xl font-extrabold text-text-primary sm:text-3xl">
        {isBusinessCustom ? (
          'Prix sur devis'
        ) : (
          <>
            {formatPriceEur(plan.priceEur, { decimals: priceDecimals })}{' '}
            <span className="text-[0.55em] font-bold">{PRICE_EXCL_TAX_LABEL}</span>
          </>
        )}
      </p>
      {plan.pricePerSheetEur !== null ? (
        <p className="mt-1 text-xs font-medium text-purple-600 sm:text-sm">
          soit {formatPriceEur(plan.pricePerSheetEur)}{' '}
          <span className="text-[0.85em] font-semibold">{PRICE_EXCL_TAX_LABEL}</span> / fiche
        </p>
      ) : plan.priceSuffix ? (
        <p className="mt-1 text-xs font-medium text-purple-600 sm:text-sm">
          {plan.priceSuffix}
          {!isBusinessCustom ? ` · ${PRICE_EXCL_TAX_LABEL}` : null}
        </p>
      ) : null}
      <p className="mt-1.5 text-xs text-text-muted sm:text-sm">{plan.creditsLabel}</p>

      <hr className="my-4 border-soft sm:my-5" />

      <ul className="mb-4 flex flex-1 flex-col gap-2 sm:mb-6 sm:gap-2.5">
        {plan.features.map((feature) => (
          <li
            key={feature.label}
            className={cn(
              'flex items-start gap-1.5 text-xs sm:gap-2 sm:text-sm',
              feature.included ? 'text-text-primary' : 'text-text-muted line-through',
            )}
          >
            <Check
              size={14}
              className={cn(
                'mt-0.5 shrink-0 sm:h-4 sm:w-4',
                feature.included ? 'text-green-500' : 'text-gray-300',
              )}
              strokeWidth={2.5}
              aria-hidden
            />
            <span>{feature.label}</span>
          </li>
        ))}
      </ul>

      {plan.ctaMailto ? (
        <a
          href={plan.ctaMailto}
          className={cn(
            'inline-flex w-full items-center justify-center rounded-lg border border-soft bg-bg-white px-4 py-2 text-xs font-medium text-text-primary transition-colors hover:border-purple-400 sm:text-sm',
          )}
        >
          {plan.ctaLabel}
        </a>
      ) : (
        <Button
          type="button"
          href={isAuthenticated ? undefined : '/signup'}
          variant={plan.ctaPrimary ? 'primary' : 'neutral-outline'}
          size="sm"
          className="w-full text-xs sm:text-sm"
          glow={plan.ctaPrimary}
          disabled={checkoutLoading}
          aria-busy={checkoutLoading}
          onClick={
            isAuthenticated
              ? () => {
                  onSelectPlan(plan.id);
                }
              : undefined
          }
        >
          {checkoutLoading ? 'Redirection…' : plan.ctaLabel}
        </Button>
      )}
    </article>
  );
}
