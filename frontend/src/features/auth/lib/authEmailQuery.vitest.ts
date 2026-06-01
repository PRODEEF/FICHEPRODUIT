import { describe, expect, it } from 'vitest';

import { buildAuthEmailQuery, parseAuthEmailFromQuery } from './authEmailQuery';

describe('parseAuthEmailFromQuery', () => {
  it('retourne null pour null, vide ou invalide', () => {
    expect(parseAuthEmailFromQuery(null)).toBeNull();
    expect(parseAuthEmailFromQuery('')).toBeNull();
    expect(parseAuthEmailFromQuery('   ')).toBeNull();
    expect(parseAuthEmailFromQuery('pas-un-email')).toBeNull();
  });

  it('retourne l’e-mail trimé et validé', () => {
    expect(parseAuthEmailFromQuery('  user@exemple.fr  ')).toBe('user@exemple.fr');
  });
});

describe('buildAuthEmailQuery', () => {
  it('retourne une chaîne vide si l’e-mail est invalide', () => {
    expect(buildAuthEmailQuery('')).toBe('');
    expect(buildAuthEmailQuery('invalid')).toBe('');
  });

  it('encode l’e-mail dans le query param', () => {
    expect(buildAuthEmailQuery('user@exemple.fr')).toBe('?email=user%40exemple.fr');
  });
});
