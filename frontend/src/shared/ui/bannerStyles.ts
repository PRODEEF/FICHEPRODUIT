/** Tokens visuels partagés entre `Banner` (inline) et les toasts Sonner. */
export type BannerVariant = 'neutral' | 'success' | 'error';

export const bannerVariantClasses: Record<BannerVariant, string> = {
  neutral: 'border-border-purple bg-purple-50 text-text-primary',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  error: 'border-red-500/25 bg-red-50 text-red-900',
};

export const bannerProgressTrackClasses: Record<BannerVariant, string> = {
  neutral: 'bg-purple-200/60',
  success: 'bg-emerald-200/70',
  error: 'bg-red-200/70',
};

export const bannerProgressFillClasses: Record<BannerVariant, string> = {
  neutral: 'bg-purple-500',
  success: 'bg-emerald-500',
  error: 'bg-red-500',
};

/** Classes Sonner alignées sur `Banner` (bordure, fond, typo). */
export const bannerToastClassNames = {
  toast:
    'relative flex w-[min(100vw-2rem,24rem)] items-start gap-2 rounded-xl border px-4 py-3 text-sm leading-6 shadow-[0_4px_24px_rgba(0,0,0,0.08)]',
  success: bannerVariantClasses.success,
  error: bannerVariantClasses.error,
  title: 'font-semibold',
  description: 'mt-0.5 text-[0.8125rem] leading-5 opacity-90',
  closeButton:
    'absolute right-2 top-2 rounded-md border-0 bg-transparent p-1 text-current opacity-60 transition-opacity hover:opacity-100',
} as const;
