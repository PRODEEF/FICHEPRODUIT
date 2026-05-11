import { z } from 'zod';

/** Bornes prix (entiers €) dérivées des champs filtre une fois la saisie validée. */
export type CatalogPriceBounds = { min?: number; max?: number };

export type CatalogPriceFilterFieldKey = 'priceMin' | 'priceMax';

type ParsedPriceToken = { kind: 'empty' } | { kind: 'invalid' } | { kind: 'number'; value: number };

/**
 * Interprète une saisie prix libre : espaces, virgule décimale, symbole € ignorés ; arrondi à l’euro entier.
 */
export function parseCatalogPriceInput(raw: string): ParsedPriceToken {
  const s = raw.trim().replace(/\s/g, '').replace(/€/g, '').replace(',', '.');
  if (s === '') return { kind: 'empty' };
  const n = Number(s);
  if (!Number.isFinite(n) || n < 0) return { kind: 'invalid' };
  return { kind: 'number', value: Math.round(n) };
}

/**
 * Valide la paire prix min / max (champs optionnels, cohérence min ≤ max).
 */
export const catalogPriceFilterSchema = z
  .object({
    priceMin: z.string(),
    priceMax: z.string(),
  })
  .superRefine((data, ctx) => {
    const min = parseCatalogPriceInput(data.priceMin);
    const max = parseCatalogPriceInput(data.priceMax);
    if (min.kind === 'invalid') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Entrez un nombre positif ou laissez vide.',
        path: ['priceMin'],
      });
    }
    if (max.kind === 'invalid') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Entrez un nombre positif ou laissez vide.',
        path: ['priceMax'],
      });
    }
    if (min.kind === 'number' && max.kind === 'number' && min.value > max.value) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Le prix minimum doit être inférieur ou égal au prix maximum.',
        path: ['priceMax'],
      });
    }
  })
  .transform((data): CatalogPriceBounds => {
    const min = parseCatalogPriceInput(data.priceMin);
    const max = parseCatalogPriceInput(data.priceMax);
    const out: CatalogPriceBounds = {};
    if (min.kind === 'number') out.min = min.value;
    if (max.kind === 'number') out.max = max.value;
    return out;
  });
