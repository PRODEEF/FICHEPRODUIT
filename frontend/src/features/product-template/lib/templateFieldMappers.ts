import type { ProductTemplateField } from '@types-api';

import { normalizeProductTemplateFieldType } from './productTemplates';
import type { TemplateFieldRow } from '../types';

export function newRowId(): string {
  return crypto.randomUUID();
}

export function fieldsToRows(fields: ProductTemplateField[]): TemplateFieldRow[] {
  return fields.map((f) => ({
    id: newRowId(),
    name: f.name,
    type: normalizeProductTemplateFieldType(f.type),
    required: f.required,
  }));
}

export function rowsToFields(rows: TemplateFieldRow[]): ProductTemplateField[] {
  return rows
    .map((r, order) => ({
      name: r.name.trim(),
      type: r.type,
      required: r.required,
      order,
    }))
    .filter((f) => f.name.length > 0);
}

export function applyRefinedFieldsToRows(
  previous: TemplateFieldRow[],
  refined: ProductTemplateField[],
): TemplateFieldRow[] {
  return refined.map((f, i) => {
    const prevRow = previous[i];
    return {
      id: prevRow !== undefined ? prevRow.id : newRowId(),
      name: f.name,
      type: f.type,
      required: f.required,
    };
  });
}

const DEFAULT_TEMPLATE_NAME = 'Fiche par défaut';

function normalizeTemplateNameForCompare(name: string): string {
  return name.trim().toLocaleLowerCase();
}

function isTemplateNameTaken(candidate: string, existingNames: readonly string[]): boolean {
  const normalized = normalizeTemplateNameForCompare(candidate);
  return existingNames.some((n) => normalizeTemplateNameForCompare(n) === normalized);
}

/** Propose un nom de fiche libre parmi les noms déjà utilisés dans la boutique. */
export function defaultNewTemplateName(existingNames: readonly string[]): string {
  if (!isTemplateNameTaken(DEFAULT_TEMPLATE_NAME, existingNames)) {
    return DEFAULT_TEMPLATE_NAME;
  }

  let index = 2;
  while (index < 10_000) {
    const candidate = `Fiche ${index}`;
    if (!isTemplateNameTaken(candidate, existingNames)) {
      return candidate;
    }
    index += 1;
  }

  return `Fiche ${Date.now()}`;
}
