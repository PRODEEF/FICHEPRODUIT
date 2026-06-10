import { z } from 'zod';

import { SHOP_SECTOR_LABELS } from '@shared/lib/shopSectors';

import { loginSchema } from '../../auth/lib/authSchemas';

const optionalTrimmedString = z
  .string()
  .transform((value) => value.trim())
  .transform((value) => (value === '' ? undefined : value));

export const demoRequestSchema = z.object({
  fullName: z.string().trim().min(1, 'Indiquez votre nom.'),
  email: loginSchema.shape.email,
  company: optionalTrimmedString,
  sector: z.enum(SHOP_SECTOR_LABELS, { message: 'Sélectionnez votre secteur.' }),
  message: optionalTrimmedString,
});

export type DemoRequestInput = z.input<typeof demoRequestSchema>;
export type DemoRequestPayload = z.output<typeof demoRequestSchema>;
