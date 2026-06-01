import type { RefineFieldsSource, ProductTemplateFieldType } from '@types-api';

export interface TemplateFieldRow {
  id: string;
  name: string;
  type: ProductTemplateFieldType;
  required: boolean;
}

export interface TemplateDraftState {
  templateName: string;
  fieldRows: TemplateFieldRow[];
}

export type TemplateDraftSource = 'csv' | 'product_page' | null;

export type TemplateRefineSource = RefineFieldsSource;
