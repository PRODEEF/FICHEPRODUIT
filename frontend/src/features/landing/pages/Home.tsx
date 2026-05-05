import { useNavigate } from 'react-router';

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

  return (
    <>
      {analysisOpen && siteAnalysis ? (
        <AnalysisProgress analysis={siteAnalysis} onDismiss={dismissError} />
      ) : null}
      <div className="app-content">
        <section className="hero">
          <h1>
            <span className="highlight">Génère tes fiches produits</span>
            <br />
            en quelques secondes
          </h1>
          <p className="hero-sub">
            Laisse-toi guider. Transforme ton catalogue en fiches produits optimisées SEO.
          </p>

          <HeroSearchForm
            siteInput={landing.siteInput}
            setSiteInput={landing.setSiteInput}
            suggestionsLoading={landing.suggestionsLoading}
            searchEmptyError={landing.searchEmptyError}
            handleSubmit={landing.handleSubmit}
          />

          <LandingSuggestions urls={landing.suggestedUrls} onPick={landing.handlePickSuggestion} />

          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Compatible PrestaShop & Shopify
          </p>
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
