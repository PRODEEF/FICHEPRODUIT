import type { Transition, Variants } from 'motion/react';

const prefersReducedMotion =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const withReducedDuration = (transition: Transition): Transition =>
  prefersReducedMotion ? { ...transition, duration: 0 } : transition;

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: withReducedDuration({ duration: 0.6, ease: [0.22, 1, 0.36, 1] }),
  },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: withReducedDuration({ duration: 0.5, ease: 'easeOut' }),
  },
};

export const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: prefersReducedMotion ? 0 : 0.1 } },
};

export const cardReveal: Variants = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: withReducedDuration({ duration: 0.5, ease: [0.22, 1, 0.36, 1] }),
  },
};

export const badgeBounce: Variants = {
  hidden: { opacity: 0, scale: 0.8, y: -10 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: prefersReducedMotion
      ? { duration: 0 }
      : {
          type: 'spring',
          stiffness: 400,
          damping: 20,
          delay: 0.1,
        },
  },
};

export const titleReveal: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: withReducedDuration({
      duration: 0.7,
      ease: [0.22, 1, 0.36, 1],
      delay: prefersReducedMotion ? 0 : 0.2,
    }),
  },
};

export const getSlideVariant = (fromLeft: boolean): Variants => ({
  hidden: { opacity: 0, x: fromLeft ? -40 : 40 },
  visible: {
    opacity: 1,
    x: 0,
    transition: withReducedDuration({ duration: 0.7, ease: [0.22, 1, 0.36, 1] }),
  },
});
