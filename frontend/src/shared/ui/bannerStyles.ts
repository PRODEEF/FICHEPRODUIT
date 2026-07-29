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
