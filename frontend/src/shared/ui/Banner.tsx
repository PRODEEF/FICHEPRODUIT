import { useEffect, useState, type HTMLAttributes, type ReactNode } from 'react';
import { motion } from 'motion/react';

import { cn } from '../lib/cn';
import {
  bannerProgressFillClasses,
  bannerProgressTrackClasses,
  bannerVariantClasses,
  type BannerVariant,
} from './bannerStyles';

type BannerProps = HTMLAttributes<HTMLDivElement> & {
  variant?: BannerVariant;
  autoDismissAfterMs?: number;
  onDismiss?: () => void;
  children: ReactNode;
};

function usePrefersReducedMotion(): boolean {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => void setReducedMotion(mediaQuery.matches);
    queueMicrotask(update);
    mediaQuery.addEventListener('change', update);
    return () => void mediaQuery.removeEventListener('change', update);
  }, []);

  return reducedMotion;
}

export function Banner({
  variant = 'neutral',
  className,
  autoDismissAfterMs,
  onDismiss,
  children,
  ...props
}: BannerProps) {
  const reducedMotion = usePrefersReducedMotion();
  const [isExiting, setIsExiting] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const hasAutoDismiss = typeof autoDismissAfterMs === 'number' && autoDismissAfterMs > 0;

  useEffect(() => {
    if (!hasAutoDismiss) return;

    const progressStart = window.requestAnimationFrame(() => {
      setShowProgress(true);
    });

    const dismissTimer = window.setTimeout(() => {
      if (reducedMotion) {
        onDismiss?.();
        return;
      }
      setIsExiting(true);
    }, autoDismissAfterMs);

    return () => {
      window.cancelAnimationFrame(progressStart);
      window.clearTimeout(dismissTimer);
    };
  }, [autoDismissAfterMs, hasAutoDismiss, onDismiss, reducedMotion]);

  return (
    <motion.div
      className="w-full"
      initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -10, scale: 0.99 }}
      animate={
        isExiting
          ? reducedMotion
            ? { opacity: 0 }
            : { opacity: 0, y: -8, scale: 0.98 }
          : reducedMotion
            ? { opacity: 1 }
            : { opacity: 1, y: 0, scale: 1 }
      }
      transition={{ duration: reducedMotion ? 0 : 0.3, ease: [0.22, 1, 0.36, 1] }}
      onAnimationComplete={() => {
        if (isExiting) onDismiss?.();
      }}
    >
      <div
        className={cn(
          'overflow-hidden rounded-xl border text-left',
          bannerVariantClasses[variant],
          className,
        )}
        {...props}
      >
        <p className="m-0 px-4 py-3 text-sm leading-6">{children}</p>

        {hasAutoDismiss ? (
          <div className={cn('h-1 w-full', bannerProgressTrackClasses[variant])} aria-hidden="true">
            <motion.span
              className={cn('block h-full origin-left', bannerProgressFillClasses[variant])}
              initial={{ scaleX: 1 }}
              animate={{ scaleX: showProgress ? 0 : 1 }}
              transition={{
                duration: autoDismissAfterMs / 1000,
                ease: 'linear',
              }}
            />
          </div>
        ) : null}
      </div>
    </motion.div>
  );
}
