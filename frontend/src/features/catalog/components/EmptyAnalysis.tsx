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
      <header className="mb-6">
        <h2 className="analyses-title analyses-title--primary">Analyse ton site</h2>
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
    </section>
  );
}
