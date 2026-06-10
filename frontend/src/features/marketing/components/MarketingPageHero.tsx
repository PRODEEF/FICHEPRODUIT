import { motion } from 'motion/react';
import { useEffect, useState, type ReactNode } from 'react';

import { badgeBounce, titleReveal } from '@lib/motionVariants';

type MarketingPageHeroProps = {
  badge: string;
  title: ReactNode;
  titleHighlight?: ReactNode;
  subtitle: string;
};

export function MarketingPageHero({ badge, title, titleHighlight, subtitle }: MarketingPageHeroProps) {
  const [prefersReduced, setPrefersReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => void setPrefersReduced(mq.matches);
    queueMicrotask(apply);
    mq.addEventListener('change', apply);
    return () => void mq.removeEventListener('change', apply);
  }, []);

  return (
    <section className="flex flex-col items-center px-6 pb-10 pt-12 text-center">
      <motion.div
        variants={badgeBounce}
        initial="hidden"
        animate="visible"
        className="mb-8 inline-flex items-center gap-2 rounded-full border border-border-purple bg-purple-50 px-4 py-2 text-sm text-purple-600"
      >
        {badge}
      </motion.div>
      <motion.h1
        variants={titleReveal}
        initial="hidden"
        animate="visible"
        className="mb-4 text-[clamp(1.8rem,4vw,3rem)] font-black leading-[1.15] text-text-primary"
      >
        {title}
        {titleHighlight ? (
          <>
            <br />
            <span className="bg-gradient-to-br from-purple-600 to-purple-400 bg-clip-text text-transparent">
              {titleHighlight}
            </span>
          </>
        ) : null}
      </motion.h1>
      <motion.p
        className="max-w-[560px] text-base text-text-secondary"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: prefersReduced ? 0 : 0.6,
          delay: prefersReduced ? 0 : 0.35,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        {subtitle}
      </motion.p>
    </section>
  );
}
