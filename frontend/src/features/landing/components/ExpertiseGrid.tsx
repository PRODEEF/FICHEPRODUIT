import { motion } from 'motion/react';
import { cardReveal, staggerContainer, titleReveal } from '@lib/utils/motionVariants';

import { universes } from '../types';

import { useScrollReveal } from '../hooks/useScrollReveal';

export function ExpertiseGrid() {
  const { ref: titleRef, inView: titleInView } = useScrollReveal<HTMLHeadingElement>(0.5);
  const { ref, inView } = useScrollReveal(0.2);

  return (
    <motion.section
      className="py-20 px-4 max-w-5xl mx-auto"
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
        className="text-3xl font-extrabold text-gray-900 mb-4 text-center"
      >
        ficheproduct connaît ton univers
      </motion.h2>
      <motion.p
        className="text-gray-500 mb-12 text-center"
        variants={titleReveal}
        initial="hidden"
        animate={titleInView ? 'visible' : 'hidden'}
      >
        Notre moteur adapte le ton, la technicité et les arguments selon ta niche e-commerce.
      </motion.p>
      <motion.div
        ref={ref}
        variants={staggerContainer}
        initial="hidden"
        animate={inView ? 'visible' : 'hidden'}
        className="grid grid-cols-2 md:grid-cols-3 gap-4"
      >
        {universes.slice(0, 6).map((item) => (
          <motion.article
            key={item.label}
            variants={cardReveal}
            whileHover={{ y: -6, scale: 1.01 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="bg-white border border-gray-200 rounded-2xl p-5 transition-all duration-200 cursor-default"
          >
            <item.icon size={28} className={`mb-3 ${item.color}`} strokeWidth={2} />
            <h3 className="font-bold text-gray-900 text-sm mb-2">{item.label}</h3>
            <p className="text-xs text-gray-400 italic leading-relaxed">{item.example}</p>
          </motion.article>
        ))}
      </motion.div>
    </motion.section>
  );
}
