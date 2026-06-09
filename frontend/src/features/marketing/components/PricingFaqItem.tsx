import { Minus, Plus } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';

import { cn } from '@shared/lib/cn';

import type { PricingFaqItem as PricingFaqItemData } from '../lib/pricingFaq';

interface PricingFaqItemProps {
  item: PricingFaqItemData;
  isOpen: boolean;
  isLast: boolean;
  onToggle: () => void;
}

export function PricingFaqItem({ item, isOpen, isLast, onToggle }: PricingFaqItemProps) {
  const [prefersReduced, setPrefersReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => void setPrefersReduced(mq.matches);
    queueMicrotask(apply);
    mq.addEventListener('change', apply);
    return () => void mq.removeEventListener('change', apply);
  }, []);

  const transition = prefersReduced
    ? { duration: 0 }
    : { duration: 0.28, ease: [0.22, 1, 0.36, 1] as const };

  return (
    <li className={cn(!isLast && 'border-b border-soft')}>
      <button
        type="button"
        className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
        aria-expanded={isOpen}
        onClick={onToggle}
      >
        <span className="text-sm font-bold text-text-primary">{item.question}</span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={transition}
          className="shrink-0 text-purple-500"
          aria-hidden
        >
          {isOpen ? <Minus size={18} /> : <Plus size={18} />}
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {isOpen ? (
          <motion.div
            key="answer"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={transition}
            className="overflow-hidden"
          >
            <p className="px-6 pb-5 text-sm leading-relaxed text-text-secondary">{item.answer}</p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </li>
  );
}
