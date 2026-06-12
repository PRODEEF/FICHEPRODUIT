import { motion } from 'motion/react';
import { Download, Sparkles, Target } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { cardReveal, staggerContainer, titleReveal } from '@lib/motionVariants';
import { Card } from '@shared/ui';
import { useScrollReveal } from '@shared/hooks/useScrollReveal';

import { ABOUT_DIFFERENTIATORS } from '../lib/aboutContent';

const differentiatorIcons: Record<string, LucideIcon> = {
  'adapted-universe': Sparkles,
  'seo-ready': Target,
  'direct-export': Download,
};

export function AboutDifferentiatorsSection() {
  const { ref: titleRef, inView: titleInView } = useScrollReveal<HTMLHeadingElement>(0.5);
  const { ref, inView } = useScrollReveal(0.2);

  return (
    <motion.section
      className="mx-auto max-w-5xl px-6 pb-16"
      variants={cardReveal}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15 }}
    >
      <motion.h2
        ref={titleRef}
        variants={titleReveal}
        initial="hidden"
        animate={titleInView ? 'visible' : 'hidden'}
        className="mb-4 text-center text-3xl font-extrabold text-text-primary"
      >
        Pourquoi ficheproduct fait la différence
      </motion.h2>
      <motion.p
        variants={titleReveal}
        initial="hidden"
        animate={titleInView ? 'visible' : 'hidden'}
        className="mb-12 text-center text-text-secondary"
      >
        Un outil pensé pour le terrain des boutiques en ligne, pas pour des cas d’usage génériques.
      </motion.p>
      <motion.div
        ref={ref}
        variants={staggerContainer}
        initial="hidden"
        animate={inView ? 'visible' : 'hidden'}
        className="grid grid-cols-1 gap-6 md:grid-cols-3"
      >
        {ABOUT_DIFFERENTIATORS.map((item) => {
          const Icon = differentiatorIcons[item.id] ?? Sparkles;
          return (
            <motion.div key={item.id} variants={cardReveal}>
              <Card className="flex h-full flex-col gap-3 p-6">
                <p className="m-0 text-xs font-bold uppercase tracking-widest text-purple-600">
                  {item.badge}
                </p>
                <Icon className="h-6 w-6 text-purple-600" strokeWidth={2} aria-hidden />
                <h3 className="text-lg font-bold text-text-primary">{item.title}</h3>
                <p className="m-0 text-sm leading-relaxed text-text-secondary">{item.description}</p>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>
    </motion.section>
  );
}
