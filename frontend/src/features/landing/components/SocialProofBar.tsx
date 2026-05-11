import { useEffect, useRef } from 'react';
import { animate, motion, useInView, useMotionValue, useTransform } from 'motion/react';

import { fadeIn } from '@lib/motionVariants';
import { universes } from '../types';

function AnimatedCounter({ target }: { target: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.floor(v).toLocaleString('fr-FR'));
  const prefersReduced =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    if (!inView) return;

    const controls = animate(count, target, {
      duration: prefersReduced ? 0 : 1.8,
      ease: [0.22, 1, 0.36, 1],
    });

    return controls.stop;
  }, [count, inView, prefersReduced, target]);

  return <motion.span ref={ref}>{rounded}</motion.span>;
}

export function SocialProofBar() {
  return (
    <motion.section
      className="bg-purple-50 border-b border-purple-100 py-4 text-center overflow-hidden"
      variants={fadeIn}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
    >
      <p className="text-sm text-purple-700 font-medium mb-3">
        Déjà utilisé par des marchands dans ces univers
      </p>

      <div className="relative w-full overflow-hidden">
        <div className="animate-marquee flex min-w-max gap-8">
          {[...universes, ...universes].map((u, i) => (
            <span
              key={`${u.label}-${i}`}
              className="inline-flex items-center gap-2 bg-white border border-purple-200 text-purple-700 text-sm font-medium px-4 py-2 rounded-full flex-shrink-0"
            >
              <u.icon size={14} className="text-purple-700" strokeWidth={2} />
              {u.label}
            </span>
          ))}
        </div>
      </div>

      <p className="text-3xl font-black text-purple-700 mt-6">
        <span className="text-purple-500">
          <AnimatedCounter target={2000} />+
        </span>{' '}
        marchands accompagnés
      </p>
    </motion.section>
  );
}
