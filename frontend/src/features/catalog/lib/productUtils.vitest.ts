import { describe, expect, it } from 'vitest';

import { uniqueSorted, uniqueSortedCaseInsensitive } from './productUtils';

describe('uniqueSorted', () => {
  it('déduplique de façon sensible à la casse', () => {
    expect(uniqueSorted(['F-ONE', 'F-One', 'Duotone'])).toEqual(['Duotone', 'F-One', 'F-ONE']);
  });
});

describe('uniqueSortedCaseInsensitive', () => {
  it('ne garde qu’une entrée par marque sans tenir compte de la casse', () => {
    expect(uniqueSortedCaseInsensitive(['F-ONE', 'F-One', 'Duotone', 'f-one'])).toEqual([
      'Duotone',
      'F-ONE',
    ]);
  });

  it('ignore les chaînes vides', () => {
    expect(uniqueSortedCaseInsensitive(['  ', 'Nike', ''])).toEqual(['Nike']);
  });
});
