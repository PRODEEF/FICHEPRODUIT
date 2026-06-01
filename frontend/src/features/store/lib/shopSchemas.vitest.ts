import { describe, expect, it } from 'vitest';

import { shopSectorSchema } from './shopSchemas';

describe('shopSectorSchema', () => {
  it('accepte un label valide', () => {
    const r = shopSectorSchema.safeParse('Vélo');
    expect(r.success).toBe(true);
    if (r.success) expect(r.data).toBe('Vélo');
  });

  it('transforme une chaîne vide en null', () => {
    const r = shopSectorSchema.safeParse('');
    expect(r.success).toBe(true);
    if (r.success) expect(r.data).toBeNull();
  });

  it('rejette une valeur hors liste', () => {
    const r = shopSectorSchema.safeParse('Kitesurf');
    expect(r.success).toBe(false);
  });
});
