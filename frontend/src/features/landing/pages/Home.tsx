import { Navigate, useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';

import { fadeUp, titleReveal, badgeBounce } from '@lib/motionVariants';
import { setGuestSessionId } from '@lib/analysis/guestSessionStorage';
import { AnalysisProgress } from '@shared/components/AnalysisProgress';
import { UrlSearchForm } from '@shared/components/UrlSearchForm';
import { UrlsSuggestions } from '@shared/components/UrlsSuggestions';
import { useAuth } from '@shared/hooks/useAuth';
import { useUrlSearch } from '@shared/hooks/useUrlSearch';

import { ExpertiseGrid } from '../components/ExpertiseGrid';
import { FinalCTA } from '../components/FinalCTA';
import { HowItWorks } from '../components/HowItWorks';
// import { LandingFooter } from '../components/LandingFooter';
import { SellingPoints } from '../components/SellingPoints';
import { SocialProofBar } from '../components/SocialProofBar';
import { Testimonials } from '../components/Testimonials';
import { useGuestSiteAnalysis } from '../hooks/useGuestSiteAnalysis';

export function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { runAnalysis, analysisOpen, siteAnalysis, dismissError } = useGuestSiteAnalysis({
    onSuccess: (summary) => {
      // Les invités atterrissent sur la vue publique d'analyse,
      // les utilisateurs connectés sur leur catalogue privé.
      if (!user && summary.sessionId) {
        setGuestSessionId(summary.sessionId);
      }
      const target = user
        ? '/catalog'
        : `/catalog/public/${summary.id}${summary.sessionId ? `?s=${encodeURIComponent(summary.sessionId)}` : ''}`;
      void navigate(target);
    },
  });

  const search = useUrlSearch({ onSubmit: runAnalysis });

  const [prefersReduced, setPrefersReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => void setPrefersReduced(mq.matches);
    queueMicrotask(apply);
    mq.addEventListener('change', apply);
    return () => void mq.removeEventListener('change', apply);
  }, []);

  if (user) {
    return <Navigate to="/catalog" replace />;
  }

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
            ✦ Nouveau – Export Shopify et PrestaShop en un clic
          </motion.div>
          <motion.h1
            variants={titleReveal}
            initial="hidden"
            animate="visible"
            className="mb-4 text-[clamp(1.8rem,4vw,3rem)] font-black leading-[1.15] text-text-primary"
          >
            <span className="bg-gradient-to-br from-purple-600 to-purple-400 bg-clip-text text-transparent">
              Générez vos fiches produits et importez les
            </span>
            <br />
            en quelques secondes sur votre site
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
            Laissez-vous guider. Transformez votre catalogue en fiches produits optimisées SEO.
          </motion.p>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            transition={{ duration: prefersReduced ? 0 : 0.6, delay: prefersReduced ? 0 : 0.5 }}
            className="w-full"
          >
            <UrlSearchForm
              siteInput={search.input}
              setSiteInput={search.setInput}
              suggestionsLoading={search.suggestionsLoading}
              searchEmptyError={search.inputEmptyError}
              handleSubmit={() => {
                void search.handleSubmit();
              }}
            />
          </motion.div>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="w-full flex justify-center"
          >
            <UrlsSuggestions
              urls={search.suggestedUrls}
              onPick={(url) => {
                void search.handlePickSuggestion(url);
              }}
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
