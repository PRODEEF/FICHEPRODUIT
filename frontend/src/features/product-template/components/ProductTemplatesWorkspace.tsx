import { useState } from 'react';

import type { ProductTemplate } from '@types-api';
import { useAuth } from '@shared/hooks/useAuth';
import { useShop } from '../../store/hooks/useShop';
import { useCsvTemplateImport } from '../hooks/useCsvTemplateImport';
import { useProductPageAnalysis } from '../hooks/useProductPageAnalysis';
import { useProductTemplates } from '../hooks/useProductTemplates';
import { useRefineTemplateFields } from '../hooks/useRefineTemplateFields';
import {
  defaultNewTemplateName,
  fieldsToRows,
  newRowId,
} from '../lib/templateFieldMappers';
import type { TemplateDraftSource, TemplateDraftState } from '../types';
import { EditTemplateView } from './EditTemplateView';
import { NewTemplatePanel } from './NewTemplatePanel';
import { ProductTemplatesList } from './ProductTemplatesList';
import type { TemplateFieldRow } from '../types';

type View = { kind: 'list' } | { kind: 'edit'; templateId: string };

export type ProductSheetMainTab = 'mes-fiches' | 'nouvelle';

export interface ProductTemplatesWorkspaceProps {
  sheetTab: ProductSheetMainTab;
  onSheetTabChange: (tab: ProductSheetMainTab) => void;
  onEditModeChange?: (editing: boolean) => void;
}

export function ProductTemplatesWorkspace({
  sheetTab,
  onSheetTabChange,
  onEditModeChange,
}: ProductTemplatesWorkspaceProps) {
  const { profile, profileLoading } = useAuth();
  const { shop, loading: shopLoading, error: shopError } = useShop();
  const shopId = shop?.id;
  const shopReady = Boolean(shopId);

  const {
    templates,
    loading: templatesLoading,
    error: templatesError,
    saveTemplate,
    deleteTemplate,
  } = useProductTemplates(shopId);

  const urlAnalysis = useProductPageAnalysis(shopId, profile?.website_url);
  const { refiningAi, clearAiRefineHint, refineRows } = useRefineTemplateFields(shopId);
  const csvImport = useCsvTemplateImport();

  const [view, setView] = useState<View>({ kind: 'list' });
  const [actionError, setActionError] = useState<string | null>(null);

  const [templateName, setTemplateName] = useState('Fiche par défaut');
  const [fieldRows, setFieldRows] = useState<TemplateFieldRow[]>([]);
  const [saving, setSaving] = useState(false);

  const [draft, setDraft] = useState<TemplateDraftState | null>(null);
  const [draftFieldSamples, setDraftFieldSamples] = useState<Record<string, string> | null>(
    null,
  );
  const [draftSource, setDraftSource] = useState<TemplateDraftSource>(null);
  const [draftSaving, setDraftSaving] = useState(false);

  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [manualDraft, setManualDraft] = useState<TemplateDraftState>({
    templateName: '',
    fieldRows: [],
  });
  const [modalSaving, setModalSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const loading = profileLoading || shopLoading || templatesLoading;
  const loadError = shopError ?? templatesError;

  const refineDisabled =
    !shopReady ||
    refiningAi ||
    (draft !== null
      ? draft.fieldRows.length === 0 || draft.fieldRows.some((r) => !r.name.trim())
      : fieldRows.length === 0 || fieldRows.some((r) => !r.name.trim()));

  const handleDeleteTemplate = async (t: ProductTemplate) => {
    setActionError(null);
    await deleteTemplate(t.id);
    if (view.kind === 'edit' && view.templateId === t.id) {
      setView({ kind: 'list' });
      onEditModeChange?.(false);
    }
  };

  const openEdit = (t: ProductTemplate) => {
    setActionError(null);
    clearAiRefineHint();
    setTemplateName(t.name);
    setFieldRows(fieldsToRows(t.fields));
    setView({ kind: 'edit', templateId: t.id });
    onEditModeChange?.(true);
  };

  const handleCsvFile = async (file: File | null) => {
    if (!file) return;
    setActionError(null);
    clearAiRefineHint();
    const result = await csvImport.importFromFile(file, templates.length);
    if ('error' in result) {
      setActionError(result.error);
      return;
    }
    setDraftFieldSamples(result.sampleValues);
    setDraftSource('csv');
    setDraft(result.draft);
    urlAnalysis.clearScrapeNotes();
  };

  const handleUrlAnalyze = async () => {
    setActionError(null);
    clearAiRefineHint();
    try {
      const result = await urlAnalysis.analyze();
      if (!result) return;
      setDraftFieldSamples(
        Object.keys(result.sampleValues).length > 0 ? result.sampleValues : null,
      );
      setDraftSource('product_page');
      setDraft({
        templateName: defaultNewTemplateName(templates.length),
        fieldRows: fieldsToRows(result.fields),
      });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Analyse URL impossible.');
    }
  };

  const handleRefineDraft = async () => {
    if (!draft) return;
    setActionError(null);
    try {
      const source =
        draftSource === 'csv'
          ? 'csv_import'
          : draftSource === 'product_page'
            ? 'product_page'
            : 'manual';
      const nextRows = await refineRows(draft.fieldRows, source, draftFieldSamples);
      setDraft({ ...draft, fieldRows: nextRows });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Affinage IA impossible.');
    }
  };

  const handleRefineEdit = async () => {
    setActionError(null);
    try {
      const nextRows = await refineRows(fieldRows, 'manual');
      setFieldRows(nextRows);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Affinage IA impossible.');
    }
  };

  const handleSaveDraft = async () => {
    if (!draft) return;
    setDraftSaving(true);
    setActionError(null);
    try {
      await saveTemplate(undefined, draft.templateName, draft.fieldRows);
      setDraft(null);
      setDraftFieldSamples(null);
      setDraftSource(null);
      clearAiRefineHint();
      onSheetTabChange('mes-fiches');
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Enregistrement impossible.');
    } finally {
      setDraftSaving(false);
    }
  };

  const handleCancelDraft = () => {
    setDraft(null);
    setDraftFieldSamples(null);
    setDraftSource(null);
    clearAiRefineHint();
  };

  const openManualModal = () => {
    setModalError(null);
    setManualDraft({
      templateName: defaultNewTemplateName(templates.length),
      fieldRows: [{ id: newRowId(), name: '', type: 'text', required: false }],
    });
    setManualModalOpen(true);
  };

  const handleSaveManual = async () => {
    setModalSaving(true);
    setModalError(null);
    try {
      await saveTemplate(undefined, manualDraft.templateName, manualDraft.fieldRows);
      setManualModalOpen(false);
      onSheetTabChange('mes-fiches');
    } catch (e) {
      setModalError(e instanceof Error ? e.message : 'Enregistrement impossible.');
    } finally {
      setModalSaving(false);
    }
  };

  const handleSaveEdit = async () => {
    if (view.kind !== 'edit') return;
    setSaving(true);
    setActionError(null);
    try {
      await saveTemplate(view.templateId, templateName, fieldRows);
      setView({ kind: 'list' });
      onEditModeChange?.(false);
      onSheetTabChange('mes-fiches');
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Enregistrement impossible.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <p className="analyses-status" aria-busy="true">
        Chargement des fiches type…
      </p>
    );
  }

  if (loadError) {
    return (
      <p className="analyses-status analyses-status-error" role="alert">
        {loadError}
      </p>
    );
  }

  if (view.kind === 'edit') {
    return (
      <div className="product-templates-workspace w-full">
        <EditTemplateView
          templateName={templateName}
          onTemplateNameChange={setTemplateName}
          fieldRows={fieldRows}
          onFieldRowsChange={setFieldRows}
          refiningAi={refiningAi}
          refineDisabled={refineDisabled || saving}
          saving={saving}
          actionError={actionError}
          onRefine={() => void handleRefineEdit()}
          onSave={() => void handleSaveEdit()}
          onCancel={() => {
            setView({ kind: 'list' });
            setActionError(null);
            clearAiRefineHint();
            onEditModeChange?.(false);
          }}
        />
      </div>
    );
  }

  return (
    <div className="product-templates-workspace w-full">
      <div
        role="tabpanel"
        id="panel-mes-fiches"
        aria-labelledby="tab-mes-fiches"
        hidden={sheetTab !== 'mes-fiches'}
        className="product-sheet-tab-panel"
      >
        {templates.length === 0 ? (
          <div className="product-templates-empty-mes-fiches">
            <p className="product-sheet-intro max-w-none">
              Vous n&apos;avez pas encore de fiche type. Définissez la structure des champs
              (colonnes) pour vos imports PrestaShop.
            </p>
            <button
              type="button"
              className="product-sheet-save-btn"
              onClick={() => void onSheetTabChange('nouvelle')}
            >
              Créer une fiche
            </button>
          </div>
        ) : (
          <ProductTemplatesList
            templates={templates}
            onEdit={openEdit}
            onDelete={handleDeleteTemplate}
          />
        )}
      </div>

      <div
        role="tabpanel"
        id="panel-nouvelle-fiche"
        aria-labelledby="tab-nouvelle-fiche"
        hidden={sheetTab !== 'nouvelle'}
        className="product-sheet-tab-panel"
      >
        <NewTemplatePanel
          shopReady={shopReady}
          csvInputRef={csvImport.csvInputRef}
          onCsvFileSelected={(file) => void handleCsvFile(file)}
          onOpenCsvPicker={csvImport.openFilePicker}
          scrapeUrl={urlAnalysis.scrapeUrl}
          onScrapeUrlChange={urlAnalysis.setScrapeUrl}
          scraping={urlAnalysis.scraping}
          urlEmptyError={urlAnalysis.urlEmptyError}
          scrapeNotes={urlAnalysis.scrapeNotes}
          onUrlAnalyze={() => void handleUrlAnalyze()}
          onOpenManualModal={openManualModal}
          actionError={actionError}
          draft={draft}
          onDraftChange={setDraft}
          refiningAi={refiningAi}
          refineDisabled={refineDisabled || draftSaving}
          draftSaving={draftSaving}
          onRefineDraft={() => void handleRefineDraft()}
          onSaveDraft={() => void handleSaveDraft()}
          onCancelDraft={handleCancelDraft}
          manualModalOpen={manualModalOpen}
          manualDraft={manualDraft}
          onManualDraftChange={setManualDraft}
          modalSaving={modalSaving}
          modalError={modalError}
          onSaveManual={() => void handleSaveManual()}
          onCloseManual={() => {
            setManualModalOpen(false);
            setModalError(null);
          }}
        />
      </div>
    </div>
  );
}
