import { z } from 'zod';

import { parseAsFullSiteUrl } from '@lib/siteUrl';
import { SHOP_SECTOR_LABELS } from '@shared/lib/shopSectors';

export const SHOP_TAG_MAX_LENGTH = 64;

export const SHOP_URL_INVALID_MESSAGE =
  'URL invalide. Indiquez une adresse complète (ex. https://monsite.fr).';

export const shopTagSchema = z
  .string()
  .trim()
  .min(1, 'Ce champ ne peut pas être vide.')
  .max(SHOP_TAG_MAX_LENGTH, `Maximum ${SHOP_TAG_MAX_LENGTH} caractères.`);

export const shopUrlSchema = z
  .string()
  .transform((v) => v.trim())
  .refine((v) => v === '' || parseAsFullSiteUrl(v) !== null, SHOP_URL_INVALID_MESSAGE)
  .transform((v) => {
    if (v === '') return '';
    const parsed = parseAsFullSiteUrl(v);
    if (parsed === null) {
      throw new Error('Invariant Zod : URL invalide après refine.');
    }
    return parsed;
  });

export const shopSectorSchema = z
  .union([z.enum(SHOP_SECTOR_LABELS), z.literal('')])
  .transform((v) => (v === '' ? null : v));

/** Secteur obligatoire à la première saisie (comptes existants sans secteur). */
export const shopSectorRequiredSchema = z.enum(SHOP_SECTOR_LABELS, {
  message: 'Veuillez choisir un secteur dans la liste.',
});

export type ShopTagValue = z.output<typeof shopTagSchema>;
export type ShopUrlValue = z.output<typeof shopUrlSchema>;
export type ShopSectorFormValue = z.input<typeof shopSectorSchema>;
export type ShopSectorValue = z.output<typeof shopSectorSchema>;

/** Retourne le tag existant si `candidate` correspond déjà (insensible à la casse). */
export function findTagCaseInsensitive(tags: string[], candidate: string): string | undefined {
  const needle = candidate.trim().toLocaleLowerCase();
  if (!needle) return undefined;
  return tags.find((t) => t.toLocaleLowerCase() === needle);
}

export function shopTagDuplicateMessage(existingTag: string): string {
  return `« ${existingTag} » existe déjà dans la liste.`;
}
