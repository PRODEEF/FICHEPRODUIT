import { motion } from 'motion/react';

import { fadeUp } from '@lib/utils/motionVariants';

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
    <section className="mt-5 w-full">
      <header className="mb-6">
        <h2 className="m-0 text-[1.75rem] font-extrabold text-purple-600">Analyse ton site</h2>
        <p className="mt-1 text-sm text-text-muted">
          Lance un scan de ton site pour générer automatiquement tes premières fiches produits.
        </p>
      </header>
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.6, delay: 0.5 }}
        className="w-full"
      >
        <HeroSearchForm
          siteInput={siteInput}
          setSiteInput={setSiteInput}
          suggestionsLoading={suggestionsLoading}
          searchEmptyError={searchEmptyError}
          handleSubmit={handleSubmit}
          align="left"
        />
      </motion.div>

      <motion.div variants={fadeUp} initial="hidden" animate="visible" className="flex justify-center">
        <LandingSuggestions urls={suggestedUrls} onPick={handlePickSuggestion} />
      </motion.div>
    </section>
  );
}
