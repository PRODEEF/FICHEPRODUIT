import { useNavigate } from 'react-router';
import { motion } from 'motion/react';

import { fadeUp, titleReveal, badgeBounce } from '@lib/motionVariants';
import { useSiteAnalysis } from '@shared/hooks/useSiteAnalysis';

import { AnalysisProgress } from '../components/AnalysisProgress';
import { ExpertiseGrid } from '../components/ExpertiseGrid';
import { FinalCTA } from '../components/FinalCTA';
import { HeroSearchForm } from '../components/HeroSearchForm';
import { HowItWorks } from '../components/HowItWorks';
import { LandingFooter } from '../components/LandingFooter';
import { LandingSuggestions } from '../components/LandingSuggestions';
import { SellingPoints } from '../components/SellingPoints';
import { SocialProofBar } from '../components/SocialProofBar';
import { Testimonials } from '../components/Testimonials';
import { useLandingSearch } from '../hooks/useLandingSearch';
import { useSignupAutoAnalyze } from '../hooks/useSignupAutoAnalyze';

export function Home() {
  const navigate = useNavigate();
  const { runAnalysis, analysisOpen, siteAnalysis, dismissError } = useSiteAnalysis({
    onSuccess: (summary) => navigate(`/analyses/${summary.id}`),
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
      <div className="app-content">
        <section className="hero">
          <motion.div
            variants={badgeBounce}
            initial="hidden"
            animate="visible"
            className="gift-banner"
          >
            ✦ Nouveau - Export Shopify en 1 clic
          </motion.div>
          <motion.h1 variants={titleReveal} initial="hidden" animate="visible">
            <span className="highlight">Génère tes fiches produits</span>
            <br />
            en quelques secondes
          </motion.h1>
          <motion.p
            className="hero-sub"
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
            className="search-container"
          >
            <HeroSearchForm
              siteInput={landing.siteInput}
              setSiteInput={landing.setSiteInput}
              suggestionsLoading={landing.suggestionsLoading}
              searchEmptyError={landing.searchEmptyError}
              handleSubmit={landing.handleSubmit}
            />
          </motion.div>

          <motion.div variants={fadeUp} initial="hidden" animate="visible">
            <LandingSuggestions
              urls={landing.suggestedUrls}
              onPick={landing.handlePickSuggestion}
            />
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: prefersReduced ? 0 : 0.5, delay: prefersReduced ? 0 : 0.7 }}
            style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}
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
        <LandingFooter />
      </div>
    </>
  );
}
