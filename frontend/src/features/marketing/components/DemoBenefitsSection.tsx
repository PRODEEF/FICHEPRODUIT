import { motion } from 'motion/react';
import { Calendar, Download, Sparkles } from 'lucide-react';

import { cardReveal, staggerContainer, titleReveal } from '@lib/motionVariants';
import { useScrollReveal } from '@shared/hooks/useScrollReveal';
import { Card } from '@shared/ui';

const benefits = [
  {
    icon: Sparkles,
    title: 'Démo adaptée à votre secteur',
    description:
      'Nous vous montrons comment ficheproduct rédige pour votre niche — pas une IA générique, un vrai ton marchand.',
  },
  {
    icon: Download,
    title: 'Parcours export Shopify & PrestaShop',
    description:
      'De l’analyse de votre catalogue au CSV prêt à importer : zéro copier-coller, zéro friction.',
  },
  {
    icon: Calendar,
    title: 'Accompagnement tarifs',
    description:
      'Nous répondons à vos questions sur les forfaits, les crédits et le retour sur investissement pour votre volume.',
  },
];

export function DemoBenefitsSection() {
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
        Ce que nous couvrons en démo
      </motion.h2>
      <motion.p
        variants={titleReveal}
        initial="hidden"
        animate={titleInView ? 'visible' : 'hidden'}
        className="mb-12 text-center text-text-secondary"
      >
        Environ 15 minutes pour découvrir comment gagner des centaines d’heures sur vos fiches
        produits.
      </motion.p>
      <motion.div
        ref={ref}
        variants={staggerContainer}
        initial="hidden"
        animate={inView ? 'visible' : 'hidden'}
        className="grid grid-cols-1 gap-6 md:grid-cols-3"
      >
        {benefits.map((benefit) => (
          <motion.div key={benefit.title} variants={cardReveal}>
            <Card className="flex h-full flex-col gap-4 p-6">
              <benefit.icon className="h-7 w-7 text-purple-600" strokeWidth={2} aria-hidden />
              <h3 className="text-lg font-bold text-text-primary">{benefit.title}</h3>
              <p className="m-0 text-sm leading-relaxed text-text-secondary">
                {benefit.description}
              </p>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </motion.section>
  );
}
