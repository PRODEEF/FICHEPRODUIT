import { FinalCTA } from '@shared/components/FinalCTA';
import { useAuth } from '@shared/hooks/useAuth';

import { AboutDifferentiatorsSection } from '../components/AboutDifferentiatorsSection';
import { AboutMissionSection } from '../components/AboutMissionSection';
import { AboutQuickLinksSection } from '../components/AboutQuickLinksSection';
import { AboutValuesSection } from '../components/AboutValuesSection';
import { MarketingPageHero } from '../components/MarketingPageHero';
import { ABOUT_HERO } from '../lib/aboutContent';

export function About() {
  const { userEmail } = useAuth();
  const isAuthenticated = Boolean(userEmail);

  return (
    <div className="relative z-[1] flex-1">
      <MarketingPageHero
        badge={ABOUT_HERO.badge}
        title={ABOUT_HERO.title}
        titleHighlight={ABOUT_HERO.titleHighlight}
        subtitle={ABOUT_HERO.subtitle}
      />
      <AboutMissionSection />
      <AboutValuesSection />
      <AboutDifferentiatorsSection />
      <AboutQuickLinksSection />
      {!isAuthenticated ? <FinalCTA /> : null}
    </div>
  );
}
