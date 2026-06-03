import { z } from 'zod';

import { SHOP_SECTOR_LABELS } from '@shared/lib/shopSectors';

export const shopSectorSchema = z
  .union([z.enum(SHOP_SECTOR_LABELS), z.literal('')])
  .transform((v) => (v === '' ? null : v));

export type ShopSectorFormValue = z.input<typeof shopSectorSchema>;
export type ShopSectorValue = z.output<typeof shopSectorSchema>;
