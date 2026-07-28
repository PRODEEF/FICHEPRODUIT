import { needsShopSetup } from '@shared/lib/needsShopSetup';

export type StoreAnalysisBannerVariant = 'onboarding' | 'prompt';

export interface StoreAnalysisUiInput {
  analysisBannerOpen: boolean;
  setupHeroDismissed: boolean;
  pendingAnalysisUrl: string | null;
  shopUrl: string;
  brands: string[];
  cms?: string | null;
  categoryTree?: unknown[] | null;
}

export interface StoreAnalysisUi {
  showAnalysisHero: boolean;
  showAnalyzeAction: boolean;
  analysisBannerUrl: string;
  analysisBannerVariant: StoreAnalysisBannerVariant;
  shouldAutoOpenBanner: boolean;
}

/**
 * Calcule l’affichage bannière / bouton d’analyse sur la page magasin.
 *
 * Règles :
 * - Bannière visible dès que `analysisBannerOpen` et qu’une URL est disponible.
 * - Bouton « Analyser le site » si la bannière est fermée et qu’une URL magasin existe.
 * - Auto-ouverture onboarding si le magasin n’est pas encore enrichi et non dismiss.
 */
export function computeStoreAnalysisUi(input: StoreAnalysisUiInput): StoreAnalysisUi {
  const shopUrl = input.shopUrl.trim();
  const pending = input.pendingAnalysisUrl?.trim() || null;
  const analysisBannerUrl = pending ?? shopUrl;
  const hasAnalysisUrl = analysisBannerUrl.length > 0;
  const needsSetup = needsShopSetup({
    url: shopUrl,
    brands: input.brands,
    cms: input.cms,
    categoryTree: input.categoryTree,
  });

  const showAnalysisHero = input.analysisBannerOpen && hasAnalysisUrl;
  const showAnalyzeAction = !showAnalysisHero && shopUrl.length > 0;
  const shouldAutoOpenBanner = needsSetup && !input.setupHeroDismissed && hasAnalysisUrl;
  const analysisBannerVariant: StoreAnalysisBannerVariant =
    pending !== null ? 'prompt' : 'onboarding';

  return {
    showAnalysisHero,
    showAnalyzeAction,
    analysisBannerUrl,
    analysisBannerVariant,
    shouldAutoOpenBanner,
  };
}
