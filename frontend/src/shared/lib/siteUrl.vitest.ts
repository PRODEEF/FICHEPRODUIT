import { describe, expect, it } from 'vitest';

import { isPlausibleSiteHostname, parseAsFullSiteUrl, parseAsSiteUrl } from './siteUrl';

describe('isPlausibleSiteHostname', () => {
  it('accepte un domaine.tld', () => {
    expect(isPlausibleSiteHostname('glissup.fr')).toBe(true);
  });

  it('accepte www.domaine.tld', () => {
    expect(isPlausibleSiteHostname('www.glissup.fr')).toBe(true);
  });

  it('refuse www sans TLD', () => {
    expect(isPlausibleSiteHostname('www.glisstestk')).toBe(false);
  });

  it('refuse un hôte sans point', () => {
    expect(isPlausibleSiteHostname('localhost')).toBe(false);
  });
});

describe('parseAsFullSiteUrl', () => {
  it('accepte une URL https complète', () => {
    expect(parseAsFullSiteUrl('https://www.glissup.fr/')).toBe('https://www.glissup.fr');
  });

  it('refuse un domaine sans schéma', () => {
    expect(parseAsFullSiteUrl('monsite.fr')).toBeNull();
  });

  it('refuse www sans TLD', () => {
    expect(parseAsFullSiteUrl('https://www.glisstestk')).toBeNull();
  });

  it('refuse une URL sans point dans le hostname', () => {
    expect(parseAsFullSiteUrl('https://glisstestk')).toBeNull();
  });
});

describe('parseAsSiteUrl', () => {
  it('accepte un domaine seul', () => {
    expect(parseAsSiteUrl('glissup.fr')).toBe('https://glissup.fr');
  });

  it('refuse www sans TLD même avec schéma', () => {
    expect(parseAsSiteUrl('https://www.glisstestk')).toBeNull();
  });
});
