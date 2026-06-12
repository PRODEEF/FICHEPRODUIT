import { useMemo, useState } from 'react';

import type { ProductTemplate } from '@types-api';
import { useAuth } from '@shared/hooks/useAuth';

import { useShop } from '../../store/hooks/useShop';
import { useCsvTemplateImport } from './useCsvTemplateImport';
import { useProductPageAnalysis } from './useProductPageAnalysis';
import { useProductTemplates } from './useProductTemplates';
import { useRefineTemplateFields } from './useRefineTemplateFields';
import {
  defaultNewTemplateName,
  fieldsToRows,
  newRowId,
} from '../lib/templateFieldMappers';
import { findDuplicateFieldRowIds } from '../lib/templateSchemas';
import type {
  ProductSheetMainTab,
  ProductTemplatesView,
  TemplateDraftSource,
  TemplateDraftState,
  TemplateFieldRow,
} from '../types';

interface UseProductTemplatesWorkspaceOptions {
  onSheetTabChange: (tab: ProductSheetMainTab) => void;
  onEditModeChange?: ((editing: boolean) => void) | undefined;
}

export function useProductTemplatesWorkspace({
  onSheetTabChange,
  onEditModeChange,
}: UseProductTemplatesWorkspaceOptions) {
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

  const [view, setView] = useState<ProductTemplatesView>({ kind: 'list' });
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
  const existingTemplateNames = useMemo(
    () => templates.map((t) => t.name),
    [templates],
  );
  const editDuplicateRowIds = useMemo(
    () => findDuplicateFieldRowIds(fieldRows),
    [fieldRows],
  );
  const draftDuplicateRowIds = useMemo(
    () => (draft !== null ? findDuplicateFieldRowIds(draft.fieldRows) : new Set<string>()),
    [draft],
  );
  const manualDuplicateRowIds = useMemo(
    () => findDuplicateFieldRowIds(manualDraft.fieldRows),
    [manualDraft.fieldRows],
  );

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
    const result = await csvImport.importFromFile(file, existingTemplateNames);
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
        templateName: defaultNewTemplateName(existingTemplateNames),
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
      templateName: defaultNewTemplateName(existingTemplateNames),
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

  const cancelEdit = () => {
    setView({ kind: 'list' });
    setActionError(null);
    clearAiRefineHint();
    onEditModeChange?.(false);
  };

  const closeManualModal = () => {
    setManualModalOpen(false);
    setModalError(null);
  };

  return {
    loading,
    loadError,
    view,
    templates,
    shopReady,
    actionError,
    templateName,
    setTemplateName,
    fieldRows,
    setFieldRows,
    refiningAi,
    refineDisabled,
    saving,
    editDuplicateRowIds,
    draft,
    setDraft,
    draftSaving,
    draftDuplicateRowIds,
    manualDuplicateRowIds,
    manualModalOpen,
    manualDraft,
    setManualDraft,
    modalSaving,
    modalError,
    csvImport,
    urlAnalysis,
    handleDeleteTemplate,
    openEdit,
    handleCsvFile,
    handleUrlAnalyze,
    handleRefineDraft,
    handleRefineEdit,
    handleSaveDraft,
    handleCancelDraft,
    openManualModal,
    handleSaveManual,
    handleSaveEdit,
    cancelEdit,
    closeManualModal,
  };
}
