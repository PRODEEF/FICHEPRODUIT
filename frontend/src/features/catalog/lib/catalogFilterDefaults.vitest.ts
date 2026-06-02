import { describe, expect, it } from 'vitest';

import { createCatalogDefaultFilters, resolveDefaultShopSector } from './catalogFilterDefaults';

describe('resolveDefaultShopSector', () => {
  it('retourne une chaîne vide si secteur absent', () => {
    expect(resolveDefaultShopSector(null)).toBe('');
    expect(resolveDefaultShopSector(undefined)).toBe('');
    expect(resolveDefaultShopSector('  ')).toBe('');
  });

  it('trim le secteur boutique', () => {
    expect(resolveDefaultShopSector('  Glisse  ')).toBe('Glisse');
  });
});

describe('createCatalogDefaultFilters', () => {
  it('préremplit le secteur et vide les autres critères', () => {
    expect(createCatalogDefaultFilters('Glisse')).toEqual({
      search: '',
      sector: 'Glisse',
      category: '',
      subCategory: '',
      brand: '',
      year: '',
    });
  });
});
