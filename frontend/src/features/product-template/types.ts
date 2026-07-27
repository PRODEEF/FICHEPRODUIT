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

export interface TemplateRefineAction {
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export type ProductSheetMainTab = 'mes-fiches' | 'nouvelle';

export type ProductTemplatesView =
  | { kind: 'list' }
  | { kind: 'edit'; templateId: string };

export interface NewTemplateCsvImport {
  onFileSelected: (file: File | null) => void;
  onOpenPicker: () => void;
}

export interface NewTemplateUrlAnalysis {
  scrapeUrl: string;
  onScrapeUrlChange: (value: string) => void;
  scraping: boolean;
  urlEmptyError: boolean;
  scrapeNotes: string | null;
  onAnalyze: () => void;
}

export interface NewTemplateDraftEditor {
  draft: TemplateDraftState | null;
  onDraftChange: (draft: TemplateDraftState) => void;
  refiningAi: boolean;
  refineDisabled: boolean;
  saving: boolean;
  duplicateRowIds?: Set<string> | undefined;
  onRefine: () => void;
  onSave: () => void;
  onCancel: () => void;
}

export interface NewTemplateManualModal {
  open: boolean;
  draft: TemplateDraftState;
  onDraftChange: (draft: TemplateDraftState) => void;
  saving: boolean;
  error: string | null;
  duplicateRowIds?: Set<string> | undefined;
  onSave: () => void;
  onClose: () => void;
}
