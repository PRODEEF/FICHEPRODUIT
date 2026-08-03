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

/** Chaîne vide acceptée, sinon URL http(s) complète (schéma obligatoire). */
export const shopUrlSchema = z.string().transform((raw, ctx) => {
  const v = raw.trim();
  if (v === '') return '';
  const parsed = parseAsFullSiteUrl(v);
  if (parsed === null) {
    ctx.addIssue({ code: 'custom', message: SHOP_URL_INVALID_MESSAGE });
    return z.NEVER;
  }
  return parsed;
});

export const shopSectorSchema = z
  .union([z.enum(SHOP_SECTOR_LABELS), z.literal('')])
  .transform((v) => (v === '' ? null : v));

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
