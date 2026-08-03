import { motion } from 'motion/react';

import { cardReveal, titleReveal } from '@lib/motionVariants';
import { useScrollReveal } from '@shared/hooks/useScrollReveal';
import { Button } from '@shared/ui';

import { ABOUT_QUICK_LINKS } from '../lib/aboutContent';

export function AboutQuickLinksSection() {
  const { ref, inView } = useScrollReveal<HTMLElement>(0.2);

  return (
    <motion.section
      ref={ref}
      className="mx-auto max-w-3xl px-6 pb-20 text-center"
      variants={cardReveal}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
    >
      <motion.h2 variants={titleReveal} className="mb-4 text-2xl font-extrabold text-text-primary">
        Envie d&apos;aller plus loin ?
      </motion.h2>
      <motion.p variants={titleReveal} className="mb-8 text-text-secondary">
        Découvrez Fiche Produit en action ou commencez gratuitement.
        {/* Découvrez Fiche Produit en action ou commencez avec 3 crédits offerts. */}
      </motion.p>
      <motion.div
        variants={titleReveal}
        className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap"
      >
        {ABOUT_QUICK_LINKS.map((link) => (
          <Button key={link.id} href={link.href} variant={link.variant} size="md">
            {link.label}
          </Button>
        ))}
      </motion.div>
    </motion.section>
  );
}
