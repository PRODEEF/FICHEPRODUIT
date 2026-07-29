import { motion } from 'motion/react';
import { Globe, Search, Workflow } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { cardReveal, staggerContainer, titleReveal } from '@lib/motionVariants';
import { useScrollReveal } from '@shared/hooks/useScrollReveal';
import { Card } from '@shared/ui';

import { ABOUT_VALUES } from '../lib/aboutContent';

const valueIcons: Record<string, LucideIcon> = {
  'sector-expertise': Globe,
  'seo-quality': Search,
  'ecommerce-workflow': Workflow,
};

export function AboutValuesSection() {
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
        Ce qui nous guide
      </motion.h2>
      <motion.p
        variants={titleReveal}
        initial="hidden"
        animate={titleInView ? 'visible' : 'hidden'}
        className="mb-12 text-center text-text-secondary"
      >
        Trois piliers pour aider les marchands à produire plus, mieux et plus vite.
      </motion.p>
      <motion.div
        ref={ref}
        variants={staggerContainer}
        initial="hidden"
        animate={inView ? 'visible' : 'hidden'}
        className="grid grid-cols-1 gap-6 md:grid-cols-3"
      >
        {ABOUT_VALUES.map((value) => {
          const Icon = valueIcons[value.id] ?? Globe;
          return (
            <motion.div key={value.id} variants={cardReveal}>
              <Card className="flex h-full flex-col gap-4 p-6">
                <Icon className="h-7 w-7 text-purple-600" strokeWidth={2} aria-hidden />
                <h3 className="text-lg font-bold text-text-primary">{value.title}</h3>
                <p className="m-0 text-sm leading-relaxed text-text-secondary">
                  {value.description}
                </p>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>
    </motion.section>
  );
}
