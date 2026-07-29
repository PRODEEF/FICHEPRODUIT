import { motion } from 'motion/react';

import { cardReveal, staggerContainer, titleReveal } from '@lib/motionVariants';
import { useScrollReveal } from '@shared/hooks/useScrollReveal';
import { Button } from '@shared/ui';

import { testimonials } from '../types';

export function Testimonials() {
  const { ref: titleRef, inView: titleInView } = useScrollReveal<HTMLHeadingElement>(0.5);
  const { ref, inView } = useScrollReveal(0.2);

  return (
    <motion.section
      className="bg-gray-50 py-20 px-4"
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
        className="text-3xl font-extrabold text-gray-900 mb-12 text-center"
      >
        Ce que disent nos marchands
      </motion.h2>
      <motion.div
        ref={ref}
        variants={staggerContainer}
        initial="hidden"
        animate={inView ? 'visible' : 'hidden'}
        className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto"
      >
        {testimonials.map((item) => (
          <motion.article
            key={item.author}
            variants={cardReveal}
            whileHover={{ y: -6, scale: 1.01 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="bg-white rounded-2xl p-6 border border-purple-100 shadow-sm"
          >
            <p className="text-yellow-400 text-lg mb-3">★★★★★</p>
            <p className="text-gray-700 italic mb-4 leading-relaxed">{item.quote}</p>
            <p className="text-sm font-bold text-gray-900">{item.author}</p>
            <p className="text-xs text-gray-400">{item.details}</p>
          </motion.article>
        ))}
      </motion.div>
      <motion.div
        className="text-center mt-10"
        variants={titleReveal}
        initial="hidden"
        animate={inView ? 'visible' : 'hidden'}
      >
        <Button href="/signup" variant="ghost">
          Rejoindre 2 000 marchands →
        </Button>
      </motion.div>
    </motion.section>
  );
}
