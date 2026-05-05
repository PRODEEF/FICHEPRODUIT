import { Button } from '@shared/ui/Button';
import { motion } from 'motion/react';

import { cardReveal, staggerContainer, titleReveal } from '@lib/motionVariants';
import { useScrollReveal } from '../hooks/useScrollReveal';

const steps = [
  {
    title: 'Colle ton URL',
    description: 'ficheproduct analyse ton catalogue en quelques secondes',
  },
  {
    title: 'On détecte ton univers',
    description: 'Surf, vélo, mode… la rédaction est adaptée à ton secteur',
  },
  {
    title: 'Tu exportes',
    description: 'Fiches optimisées SEO, prêtes pour PrestaShop ou Shopify',
  },
];

export function HowItWorks() {
  const { ref: titleRef, inView: titleInView } = useScrollReveal<HTMLHeadingElement>(0.5);
  const { ref, inView } = useScrollReveal(0.2);

  return (
    <motion.section
      className="bg-white py-20 px-4"
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
        Comment ça marche
      </motion.h2>
      <motion.p
        variants={titleReveal}
        initial="hidden"
        animate={titleInView ? 'visible' : 'hidden'}
        className="text-gray-500 text-center mb-12"
      >
        Trois étapes simples pour passer de ton catalogue brut à des fiches prêtes à publier.
      </motion.p>
      <motion.div
        ref={ref}
        variants={staggerContainer}
        initial="hidden"
        animate={inView ? 'visible' : 'hidden'}
        className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto"
      >
        {steps.map((step, index) => (
          <motion.article
            key={step.title}
            variants={cardReveal}
            whileHover={{ y: -6, scale: 1.01 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <div className="bg-purple-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold mb-4 mx-auto">
              {index + 1}
            </div>
            <h3 className="font-bold text-gray-900 text-center mb-2">{step.title}</h3>
            <p className="text-gray-500 text-sm text-center">{step.description}</p>
          </motion.article>
        ))}
      </motion.div>
      <motion.div className="text-center mt-12" variants={titleReveal} initial="hidden" animate={inView ? 'visible' : 'hidden'}>
        <Button href="/signup" variant="primary" size="lg" glow>
          Essayer maintenant — c&apos;est gratuit
        </Button>
      </motion.div>
    </motion.section>
  );
}
