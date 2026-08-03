import { Banner } from '@ui';

import { MarketingPageHero } from './MarketingPageHero';
import type { LegalDocumentContent } from '../lib/legalContent';

interface LegalDocumentPageProps {
  content: LegalDocumentContent;
}

export function LegalDocumentPage({ content }: LegalDocumentPageProps) {
  const { hero, draftNotice, sections } = content;

  return (
    <div className="relative z-[1] flex-1">
      <MarketingPageHero badge={hero.badge} title={hero.title} subtitle={hero.subtitle} />

      <div className="mx-auto max-w-3xl px-6 pb-4">
        <Banner variant="neutral">{draftNotice}</Banner>
      </div>

      <main className="mx-auto max-w-3xl px-6 pb-20 pt-8">
        {sections.map((section) => (
          <section key={section.id} className="mb-10">
            <h2 className="mb-4 border-b border-soft pb-2 text-xl font-bold text-text-primary">
              {section.title}
            </h2>
            {section.paragraphs.map((paragraph) => (
              <p
                key={`${section.id}-${paragraph.slice(0, 24)}`}
                className="mb-3 text-base leading-relaxed text-text-secondary"
              >
                {paragraph}
              </p>
            ))}
          </section>
        ))}
      </main>
    </div>
  );
}
