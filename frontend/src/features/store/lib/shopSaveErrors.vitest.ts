import { describe, expect, it } from 'vitest';

import { ApiHttpError } from '@api/apiAuth';

import { SHOP_URL_INVALID_MESSAGE } from './shopSchemas';
import { mapShopSaveError } from './shopSaveErrors';

describe('mapShopSaveError', () => {
  it('retourne le message URL invalide pour une ApiHttpError 422 sur url', () => {
    const error = new ApiHttpError('Validation failed', 422);
    expect(mapShopSaveError('url', error)).toBe(SHOP_URL_INVALID_MESSAGE);
  });

  it('retourne le message de l’Error pour une erreur générique', () => {
    expect(mapShopSaveError('name', new Error('Serveur indisponible'))).toBe(
      'Serveur indisponible',
    );
  });

  it('retourne un message par défaut pour une erreur inconnue', () => {
    expect(mapShopSaveError('url', 'boom')).toBe('Enregistrement impossible.');
  });

  it('ne mappe pas une 422 sur name vers le message URL', () => {
    const error = new ApiHttpError('Champ invalide', 422);
    expect(mapShopSaveError('name', error)).toBe('Champ invalide');
  });
});
