import { motion } from 'motion/react';

import { cardReveal, titleReveal } from '@lib/motionVariants';
import { useScrollReveal } from '@shared/hooks/useScrollReveal';

import { ABOUT_MISSION } from '../lib/aboutContent';

export function AboutMissionSection() {
  const { ref, inView } = useScrollReveal<HTMLElement>(0.2);

  return (
    <motion.section
      ref={ref}
      className="mx-auto max-w-3xl px-6 pb-16 text-center"
      variants={cardReveal}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
    >
      <motion.h2
        variants={titleReveal}
        className="mb-8 text-3xl font-extrabold text-text-primary"
      >
        {ABOUT_MISSION.title}
      </motion.h2>
      <div className="space-y-5 text-base leading-relaxed text-text-secondary">
        {ABOUT_MISSION.paragraphs.map((paragraph, index) => (
          <motion.p key={index} variants={titleReveal} className="m-0">
            {paragraph}
          </motion.p>
        ))}
      </div>
    </motion.section>
  );
}
