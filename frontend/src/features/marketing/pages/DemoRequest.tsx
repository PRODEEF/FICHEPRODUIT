import { FinalCTA } from '@shared/components/FinalCTA';
import { useAuth } from '@shared/hooks/useAuth';

import { DemoBenefitsSection } from '../components/DemoBenefitsSection';
import { DemoRequestPanel } from '../components/DemoRequestPanel';
import { MarketingPageHero } from '../components/MarketingPageHero';

export function DemoRequest() {
  const { userEmail } = useAuth();
  const isAuthenticated = Boolean(userEmail);

  return (
    <div className="relative z-[1] flex-1">
      <MarketingPageHero
        badge="✦ Démo personnalisée en 15 minutes"
        title="Découvrez Fiche Produit"
        titleHighlight="adapté à votre secteur"
        subtitle="Planifiez une démonstration guidée : nous vous montrons comment transformer votre catalogue en fiches produits optimisées SEO, prêtes pour PrestaShop ou Shopify."
      />
      <DemoBenefitsSection />
      {userEmail ? <DemoRequestPanel initialEmail={userEmail} /> : <DemoRequestPanel />}
      {!isAuthenticated ? <FinalCTA /> : null}
    </div>
  );
}
