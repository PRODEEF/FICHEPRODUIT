import { useRef } from 'react';
import { useInView } from 'motion/react';

export function useScrollReveal<TElement extends HTMLElement = HTMLDivElement>(threshold = 0.15) {
  const ref = useRef<TElement>(null);
  const inView = useInView(ref, { once: true, amount: threshold });

  return { ref, inView };
}
