import { z } from 'zod';

import type { TemplateFieldRow } from '../types';

export const templateNameSchema = z
  .string()
  .trim()
  .min(1, 'Indiquez un nom pour la fiche type.')
  .max(255, 'Le nom ne peut pas dépasser 255 caractères.');

const templateFieldNameSchema = z
  .string()
  .trim()
  .min(1, 'Chaque champ doit avoir un nom.');

export interface BuildTemplateSaveSchemaOptions {
  existingNames: string[];
  excludeName?: string;
}

function normalizeTemplateName(name: string): string {
  return name.trim().toLocaleLowerCase();
}

function isNameTaken(
  candidate: string,
  existingNames: string[],
  excludeName?: string,
): string | undefined {
  const normalized = normalizeTemplateName(candidate);
  const excludeNormalized =
    excludeName !== undefined ? normalizeTemplateName(excludeName) : undefined;

  return existingNames.find((existing) => {
    const normalizedExisting = normalizeTemplateName(existing);
    if (excludeNormalized !== undefined && normalizedExisting === excludeNormalized) {
      return false;
    }
    return normalizedExisting === normalized;
  });
}

export function templateNameDuplicateMessage(existingName: string): string {
  return `« ${existingName} » existe déjà. Choisissez un autre nom.`;
}

export function templateFieldDuplicateMessage(fieldName: string): string {
  return `Le champ « ${fieldName.trim()} » est en double.`;
}

export function buildTemplateSaveSchema(options: BuildTemplateSaveSchemaOptions) {
  const { existingNames, excludeName } = options;

  return z
    .object({
      name: templateNameSchema,
      fieldRows: z
        .array(
          z.object({
            id: z.string(),
            name: templateFieldNameSchema,
            type: z.string(),
            required: z.boolean(),
          }),
        )
        .min(1, 'Ajoutez au moins un champ.'),
    })
    .superRefine((data, ctx) => {
      const taken = isNameTaken(data.name, existingNames, excludeName);
      if (taken !== undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['name'],
          message: templateNameDuplicateMessage(taken),
        });
      }

      const seen = new Map<string, number>();
      data.fieldRows.forEach((row, index) => {
        const key = row.name.trim().toLocaleLowerCase();
        if (!key) return;

        const firstIndex = seen.get(key);
        if (firstIndex === undefined) {
          seen.set(key, index);
          return;
        }

        const displayName = row.name.trim();
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['fieldRows', index, 'name'],
          message: templateFieldDuplicateMessage(displayName),
        });
        const firstName = data.fieldRows[firstIndex]?.name.trim() ?? displayName;
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['fieldRows', firstIndex, 'name'],
          message: templateFieldDuplicateMessage(firstName),
        });
      });
    });
}

export type TemplateSaveInput = z.input<ReturnType<typeof buildTemplateSaveSchema>>;

/** Retourne les IDs des lignes dont le nom est en double (comparaison insensible à la casse). */
export function findDuplicateFieldRowIds(rows: TemplateFieldRow[]): Set<string> {
  const seen = new Map<string, string>();
  const duplicateIds = new Set<string>();

  for (const row of rows) {
    const key = row.name.trim().toLocaleLowerCase();
    if (!key) continue;

    const firstId = seen.get(key);
    if (firstId === undefined) {
      seen.set(key, row.id);
      continue;
    }

    duplicateIds.add(firstId);
    duplicateIds.add(row.id);
  }

  return duplicateIds;
}

/** Premier message d'erreur Zod d'une validation de sauvegarde, ou `null` si valide. */
export function validateTemplateSave(
  input: TemplateSaveInput,
  options: BuildTemplateSaveSchemaOptions,
): string | null {
  const result = buildTemplateSaveSchema(options).safeParse(input);
  if (result.success) return null;
  return result.error.issues[0]?.message ?? 'Données invalides.';
}
