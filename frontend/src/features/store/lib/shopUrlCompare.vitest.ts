import { describe, expect, it } from 'vitest';

import { normalizeShopUrlForComparison, shopUrlsEquivalent } from './shopUrlCompare';

describe('normalizeShopUrlForComparison', () => {
  it('retourne une chaîne vide pour une entrée vide', () => {
    expect(normalizeShopUrlForComparison('')).toBe('');
    expect(normalizeShopUrlForComparison('   ')).toBe('');
  });

  it('force https si le schéma est http', () => {
    expect(normalizeShopUrlForComparison('http://exemple.fr')).toBe('https://exemple.fr');
  });

  it('ajoute https si aucun schéma', () => {
    expect(normalizeShopUrlForComparison('exemple.fr')).toBe('https://exemple.fr');
  });

  it('supprime le préfixe www', () => {
    expect(normalizeShopUrlForComparison('https://www.exemple.fr')).toBe('https://exemple.fr');
  });

  it('supprime le slash final', () => {
    expect(normalizeShopUrlForComparison('https://exemple.fr/')).toBe('https://exemple.fr');
  });

  it('met le host en minuscules', () => {
    expect(normalizeShopUrlForComparison('https://EXEMPLE.FR')).toBe('https://exemple.fr');
  });

  it('conserve le chemin sans slash final', () => {
    expect(normalizeShopUrlForComparison('https://exemple.fr/boutique/')).toBe(
      'https://exemple.fr/boutique',
    );
  });

  it('normalise une URL complète avec www, http et slash final', () => {
    expect(normalizeShopUrlForComparison('http://www.exemple.fr/')).toBe('https://exemple.fr');
  });
});

describe('shopUrlsEquivalent', () => {
  it('retourne true pour deux URLs identiques après normalisation', () => {
    expect(shopUrlsEquivalent('http://www.exemple.fr/', 'https://exemple.fr')).toBe(true);
  });

  it('retourne true si la casse du host diffère', () => {
    expect(shopUrlsEquivalent('https://EXEMPLE.FR', 'https://exemple.fr')).toBe(true);
  });

  it('retourne false pour deux domaines différents', () => {
    expect(shopUrlsEquivalent('https://exemple.fr', 'https://autre.fr')).toBe(false);
  });

  it('retourne false si une des URLs est vide', () => {
    expect(shopUrlsEquivalent('', 'https://exemple.fr')).toBe(false);
    expect(shopUrlsEquivalent('https://exemple.fr', '')).toBe(false);
  });

  it('retourne true même si www présent côté a seulement', () => {
    expect(shopUrlsEquivalent('https://www.exemple.fr', 'https://exemple.fr')).toBe(true);
  });
});
