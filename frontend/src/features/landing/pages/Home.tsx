import { useNavigate } from 'react-router';
import { motion } from 'motion/react';

import { fadeUp, titleReveal, badgeBounce } from '@lib/utils/motionVariants';
import { useSiteAnalysis } from '@shared/hooks/useSiteAnalysis';

import { useAuth } from '../../auth/useAuth';
import { AnalysisProgress } from '../components/AnalysisProgress';
import { ExpertiseGrid } from '../components/ExpertiseGrid';
import { FinalCTA } from '../components/FinalCTA';
import { HeroSearchForm } from '../components/HeroSearchForm';
import { HowItWorks } from '../components/HowItWorks';
// import { LandingFooter } from '../components/LandingFooter';
import { LandingSuggestions } from '../components/LandingSuggestions';
import { SellingPoints } from '../components/SellingPoints';
import { SocialProofBar } from '../components/SocialProofBar';
import { Testimonials } from '../components/Testimonials';
import { useLandingSearch } from '../hooks/useLandingSearch';
import { useSignupAutoAnalyze } from '../hooks/useSignupAutoAnalyze';

export function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { runAnalysis, analysisOpen, siteAnalysis, dismissError } = useSiteAnalysis({
    onSuccess: (summary) => {
      // Les invités atterrissent sur la vue publique d'analyse,
      // les utilisateurs connectés sur leur catalogue privé.
      const target = user ? `/catalog/${summary.id}` : `/catalog/public/${summary.id}`;
      navigate(target);
    },
  });

  useSignupAutoAnalyze({ runAnalysis });
  const landing = useLandingSearch({ runAnalysis });
  const prefersReduced =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <>
      {analysisOpen && siteAnalysis ? (
        <AnalysisProgress analysis={siteAnalysis} onDismiss={dismissError} />
      ) : null}
      <div className="relative z-[1] flex-1">
        <section className="flex flex-col items-center justify-start px-6 pb-16 pt-12 text-center">
          <motion.div
            variants={badgeBounce}
            initial="hidden"
            animate="visible"
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-border-purple bg-purple-50 px-4 py-2 text-sm text-purple-600"
          >
            ✦ Nouveau - Export Shopify et Prestashop en 1 clic
          </motion.div>
          <motion.h1
            variants={titleReveal}
            initial="hidden"
            animate="visible"
            className="mb-4 text-[clamp(1.8rem,4vw,3rem)] font-black leading-[1.15] text-text-primary"
          >
            <span className="bg-gradient-to-br from-purple-600 to-purple-400 bg-clip-text text-transparent">
              Génère tes fiches produits
            </span>
            <br />
            en quelques secondes
          </motion.h1>
          <motion.p
            className="mb-8 max-w-[560px] text-base text-text-secondary"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: prefersReduced ? 0 : 0.6,
              delay: prefersReduced ? 0 : 0.35,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            Laisse-toi guider. Transforme ton catalogue en fiches produits optimisées SEO.
          </motion.p>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            transition={{ duration: prefersReduced ? 0 : 0.6, delay: prefersReduced ? 0 : 0.5 }}
            className="w-full"
          >
            <HeroSearchForm
              siteInput={landing.siteInput}
              setSiteInput={landing.setSiteInput}
              suggestionsLoading={landing.suggestionsLoading}
              searchEmptyError={landing.searchEmptyError}
              handleSubmit={landing.handleSubmit}
            />
          </motion.div>

          <motion.div variants={fadeUp} initial="hidden" animate="visible" className="w-full flex justify-center">
            <LandingSuggestions
              urls={landing.suggestedUrls}
              onPick={landing.handlePickSuggestion}
            />
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: prefersReduced ? 0 : 0.5, delay: prefersReduced ? 0 : 0.7 }}
            className="text-xs text-text-muted"
          >
            Aucune carte bancaire - Résultats en 30 secondes - Annulation libre
          </motion.p>
        </section>
        <SocialProofBar />
        <HowItWorks />
        <SellingPoints />
        <Testimonials />
        <ExpertiseGrid />
        <FinalCTA />
        {/* <LandingFooter /> */}
      </div>
    </>
  );
}
