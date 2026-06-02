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

export function defaultNewTemplateName(existingCount: number): string {
  return existingCount === 0 ? 'Fiche par défaut' : `Fiche ${existingCount + 1}`;
}
