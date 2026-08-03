import { describe, expect, it } from 'vitest';

import { catalogSectorsMatch, normalizeCatalogSector } from './shopSectors';

describe('normalizeCatalogSector', () => {
  it('trim et mappe un label canonique insensible à la casse', () => {
    expect(normalizeCatalogSector('  glisse  ')).toBe('Glisse');
    expect(normalizeCatalogSector('VÉLO')).toBe('Vélo');
    expect(normalizeCatalogSector('autres')).toBe('Autres');
  });

  it('conserve une valeur inconnue trimée', () => {
    expect(normalizeCatalogSector('  Kitesurf  ')).toBe('Kitesurf');
  });

  it('retourne une chaîne vide pour null / undefined / blanc', () => {
    expect(normalizeCatalogSector(null)).toBe('');
    expect(normalizeCatalogSector(undefined)).toBe('');
    expect(normalizeCatalogSector('   ')).toBe('');
  });
});

describe('catalogSectorsMatch', () => {
  it('retourne true si le filtre secteur est vide', () => {
    expect(catalogSectorsMatch('Glisse', '')).toBe(true);
    expect(catalogSectorsMatch('Glisse', null)).toBe(true);
  });

  it('fait correspondre Autres sans tenir compte de la casse', () => {
    expect(catalogSectorsMatch('Autres', 'autres')).toBe(true);
  });

  it('rejette un secteur différent', () => {
    expect(catalogSectorsMatch('Glisse', 'Vélo')).toBe(false);
  });
});
