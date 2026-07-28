import { useState } from 'react';

import { Card } from '@shared/ui';

import { PRICING_FAQ_ITEMS } from '../lib/pricingFaq';
import { PricingFaqItem } from './PricingFaqItem';

export function PricingFaq() {
  const [openId, setOpenId] = useState<string>('null');

  return (
    <section className="mx-auto mb-16 max-w-4xl px-3 sm:px-4">
      <h2 className="mb-6 text-center text-xs font-bold tracking-widest text-text-muted uppercase">
        Questions fréquentes
      </h2>
      <Card className="overflow-hidden p-0">
        <ul>
          {PRICING_FAQ_ITEMS.map((item, index) => (
            <PricingFaqItem
              key={item.id}
              item={item}
              isOpen={openId === item.id}
              isLast={index === PRICING_FAQ_ITEMS.length - 1}
              onToggle={() => void setOpenId(openId === item.id ? 'null' : item.id)}
            />
          ))}
        </ul>
      </Card>
    </section>
  );
}
