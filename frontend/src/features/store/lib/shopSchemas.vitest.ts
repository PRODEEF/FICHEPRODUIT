import { describe, expect, it } from 'vitest';

import { ApiError } from '@api/apiError';

import {
  SHOP_TAG_MAX_LENGTH,
  SHOP_URL_INVALID_MESSAGE,
  findTagCaseInsensitive,
  mapShopSaveError,
  shopSectorSchema,
  shopTagSchema,
  shopUrlSchema,
} from './shopSchemas';

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

describe('shopTagSchema', () => {
  it('accepte un libellé valide', () => {
    const r = shopTagSchema.safeParse('  Nike  ');
    expect(r.success).toBe(true);
    if (r.success) expect(r.data).toBe('Nike');
  });

  it('rejette une chaîne vide', () => {
    const r = shopTagSchema.safeParse('   ');
    expect(r.success).toBe(false);
  });

  it(`rejette plus de ${SHOP_TAG_MAX_LENGTH} caractères`, () => {
    const r = shopTagSchema.safeParse('a'.repeat(SHOP_TAG_MAX_LENGTH + 1));
    expect(r.success).toBe(false);
  });
});

describe('shopUrlSchema', () => {
  it('accepte une URL https complète', () => {
    const r = shopUrlSchema.safeParse('https://monsite.fr/');
    expect(r.success).toBe(true);
    if (r.success) expect(r.data).toBe('https://monsite.fr');
  });

  it('accepte une chaîne vide', () => {
    const r = shopUrlSchema.safeParse('  ');
    expect(r.success).toBe(true);
    if (r.success) expect(r.data).toBe('');
  });

  it('rejette un domaine sans schéma', () => {
    const r = shopUrlSchema.safeParse('monsite.fr');
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues[0]?.message).toContain('URL invalide');
    }
  });

  it('rejette un texte qui n’est pas un lien', () => {
    const r = shopUrlSchema.safeParse('pas un lien');
    expect(r.success).toBe(false);
  });

  it('rejette un schéma non http(s)', () => {
    const r = shopUrlSchema.safeParse('ftp://monsite.fr');
    expect(r.success).toBe(false);
  });

  it('rejette www sans TLD', () => {
    const r = shopUrlSchema.safeParse('https://www.glisstestk');
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues[0]?.message).toContain('URL invalide');
    }
  });
});

describe('findTagCaseInsensitive', () => {
  it('trouve un doublon malgré la casse', () => {
    expect(findTagCaseInsensitive(['Nike', 'Adidas'], 'nike')).toBe('Nike');
  });

  it('retourne undefined si absent', () => {
    expect(findTagCaseInsensitive(['Nike'], 'Puma')).toBeUndefined();
  });
});

describe('mapShopSaveError', () => {
  it('retourne le message URL invalide pour une ApiError 422 sur url', () => {
    const error = new ApiError(422, 'Validation failed');
    expect(mapShopSaveError('url', error)).toBe(SHOP_URL_INVALID_MESSAGE);
  });

  it('retourne le message serveur pour une erreur 4xx générique', () => {
    expect(mapShopSaveError('name', new ApiError(400, 'Serveur indisponible'))).toBe(
      'Serveur indisponible',
    );
  });

  it('retourne un message par défaut pour une erreur inconnue', () => {
    expect(mapShopSaveError('url', 'boom')).toBe('Enregistrement impossible.');
  });

  it('ne mappe pas une 422 sur name vers le message URL', () => {
    const error = new ApiError(422, 'Champ invalide');
    expect(mapShopSaveError('name', error)).toBe('Champ invalide');
  });
});
