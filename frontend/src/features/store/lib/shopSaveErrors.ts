import { ApiHttpError } from '@api/apiAuth';

import { SHOP_URL_INVALID_MESSAGE } from './shopSchemas';

export type ShopInfoRowKey = 'name' | 'url' | 'cms' | 'sector';

/**
 * Message utilisateur pour une erreur d’enregistrement d’un champ boutique.
 */
export function mapShopSaveError(editing: ShopInfoRowKey, error: unknown): string {
  if (error instanceof ApiHttpError && error.status === 422 && editing === 'url') {
    return SHOP_URL_INVALID_MESSAGE;
  }
  return error instanceof Error ? error.message : 'Enregistrement impossible.';
}
