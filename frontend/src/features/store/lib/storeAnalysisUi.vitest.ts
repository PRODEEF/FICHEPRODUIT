import { describe, expect, it } from 'vitest';

import { computeStoreAnalysisUi } from './storeAnalysisUi';

describe('computeStoreAnalysisUi', () => {
  it('n’affiche ni bannière ni bouton au chargement si URL absente', () => {
    const ui = computeStoreAnalysisUi({
      analysisBannerOpen: false,
      setupHeroDismissed: false,
      pendingAnalysisUrl: null,
      shopUrl: '',
      brands: [],
    });
    expect(ui.showAnalysisHero).toBe(false);
    expect(ui.showAnalyzeAction).toBe(false);
    expect(ui.shouldAutoOpenBanner).toBe(false);
  });

  it('propose l’auto-ouverture onboarding si URL présente sans marques', () => {
    const ui = computeStoreAnalysisUi({
      analysisBannerOpen: false,
      setupHeroDismissed: false,
      pendingAnalysisUrl: null,
      shopUrl: 'https://example.com',
      brands: [],
    });
    expect(ui.shouldAutoOpenBanner).toBe(true);
    expect(ui.showAnalyzeAction).toBe(true);
  });

  it('affiche la bannière après réouverture même si onboarding dismiss', () => {
    const ui = computeStoreAnalysisUi({
      analysisBannerOpen: true,
      setupHeroDismissed: true,
      pendingAnalysisUrl: null,
      shopUrl: 'https://example.com',
      brands: [],
    });
    expect(ui.showAnalysisHero).toBe(true);
    expect(ui.showAnalyzeAction).toBe(false);
    expect(ui.analysisBannerVariant).toBe('onboarding');
  });

  it('affiche la bannière prompt après sauvegarde d’URL', () => {
    const ui = computeStoreAnalysisUi({
      analysisBannerOpen: true,
      setupHeroDismissed: false,
      pendingAnalysisUrl: 'https://shop.test',
      shopUrl: 'https://shop.test',
      brands: [],
    });
    expect(ui.showAnalysisHero).toBe(true);
    expect(ui.analysisBannerVariant).toBe('prompt');
    expect(ui.analysisBannerUrl).toBe('https://shop.test');
  });

  it('permet de relancer une analyse si le magasin est déjà enrichi', () => {
    const ui = computeStoreAnalysisUi({
      analysisBannerOpen: false,
      setupHeroDismissed: false,
      pendingAnalysisUrl: null,
      shopUrl: 'https://example.com',
      brands: ['Nike'],
    });
    expect(ui.shouldAutoOpenBanner).toBe(false);
    expect(ui.showAnalyzeAction).toBe(true);
  });

  it('ne force pas l’onboarding si le CMS a déjà été détecté', () => {
    const ui = computeStoreAnalysisUi({
      analysisBannerOpen: false,
      setupHeroDismissed: false,
      pendingAnalysisUrl: null,
      shopUrl: 'https://example.com',
      brands: [],
      cms: 'prestashop',
    });
    expect(ui.shouldAutoOpenBanner).toBe(false);
    expect(ui.showAnalyzeAction).toBe(true);
  });
});
