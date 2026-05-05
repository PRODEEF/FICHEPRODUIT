import { motion } from 'motion/react';

import { fadeUp } from '@lib/motionVariants';

import { HeroSearchForm } from '../../landing/components/HeroSearchForm';
import { LandingSuggestions } from '../../landing/components/LandingSuggestions';

type EmptyAnalysisProps = {
  siteInput: string;
  setSiteInput: (value: string) => void;
  suggestionsLoading: boolean;
  searchEmptyError: boolean;
  handleSubmit: () => void;
  suggestedUrls: string[];
  handlePickSuggestion: (url: string) => Promise<void>;
};

export function EmptyAnalysis({
  siteInput,
  setSiteInput,
  suggestionsLoading,
  searchEmptyError,
  handleSubmit,
  suggestedUrls,
  handlePickSuggestion,
}: EmptyAnalysisProps) {
  return (
    <section className="analyses-empty-catalog">
      <article className="rounded-2xl border border-soft bg-white p-6 sm:p-8 shadow-[0_8px_30px_rgba(17,24,39,0.06)]">
        <header className="text-center mb-6">
          <h2 className="analyses-title">Ton catalogue est vide</h2>
          <p className="analyses-subtitle">
            Lance un scan de ton site pour générer automatiquement tes premières fiches produits.
          </p>
        </header>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.6, delay: 0.5 }}
          className="search-container"
        >
          <HeroSearchForm
            siteInput={siteInput}
            setSiteInput={setSiteInput}
            suggestionsLoading={suggestionsLoading}
            searchEmptyError={searchEmptyError}
            handleSubmit={handleSubmit}
          />
        </motion.div>

        <motion.div variants={fadeUp} initial="hidden" animate="visible">
          <LandingSuggestions urls={suggestedUrls} onPick={handlePickSuggestion} />
        </motion.div>
      </article>
    </section>
  );
}
