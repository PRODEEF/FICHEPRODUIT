import { motion } from 'motion/react';

import { Button } from '@shared/ui/Button';
import { titleReveal } from '@lib/motionVariants';
import { useScrollReveal } from '@shared/hooks/useScrollReveal';

export function FinalCTA() {
  const { ref: titleRef, inView: titleInView } = useScrollReveal<HTMLHeadingElement>(0.5);

  return (
    <motion.section
      className="bg-purple-700 py-24 px-4 text-center text-white"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.25 }}
    >
      <motion.h2
        ref={titleRef}
        variants={titleReveal}
        initial="hidden"
        animate={titleInView ? 'visible' : 'hidden'}
        className="text-4xl font-extrabold mb-4"
      >
        Prêt à gagner des centaines d&apos;heures ?
      </motion.h2>
      <motion.p
        variants={titleReveal}
        initial="hidden"
        animate={titleInView ? 'visible' : 'hidden'}
        className="text-purple-200 mb-10 text-lg"
      >
        {/* Commencez avec 3 crédits offerts. Aucune carte bancaire requise. */}
        Commencez gratuitement. Aucune carte bancaire requise.
      </motion.p>
      <motion.div
        variants={titleReveal}
        initial="hidden"
        animate={titleInView ? 'visible' : 'hidden'}
      >
        <Button href="/signup" variant="secondary" size="lg" glow>
          S&apos;inscrire gratuitement
        </Button>
      </motion.div>
      <motion.p
        variants={titleReveal}
        initial="hidden"
        animate={titleInView ? 'visible' : 'hidden'}
        className="mt-6 text-purple-300 text-sm"
      >
        Annulation en 1 clic · Support inclus · Compatible PrestaShop & Shopify
      </motion.p>
    </motion.section>
  );
}
