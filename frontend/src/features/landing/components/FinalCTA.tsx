import { Button } from '@shared/ui/Button';
import { motion } from 'motion/react';

import { titleReveal } from '@lib/utils/motionVariants';
import { useScrollReveal } from '../hooks/useScrollReveal';

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
        Lancez-vous — 14 jours gratuits, sans carte bancaire
      </motion.h2>
      <motion.p
        variants={titleReveal}
        initial="hidden"
        animate={titleInView ? 'visible' : 'hidden'}
        className="text-purple-200 mb-10 text-lg"
      >
        Créez votre compte et commencez à générer des fiches en quelques minutes.
      </motion.p>
      <motion.div variants={titleReveal} initial="hidden" animate={titleInView ? 'visible' : 'hidden'}>
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
