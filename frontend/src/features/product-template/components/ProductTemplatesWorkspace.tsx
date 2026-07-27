import type { ProductSheetMainTab } from '../types';
import { useCsvTemplateImport } from '../hooks/useCsvTemplateImport';
import { useProductTemplatesWorkspace } from '../hooks/useProductTemplatesWorkspace';
import { EditTemplateView } from './EditTemplateView';
import { NewTemplatePanel } from './NewTemplatePanel';
import { ProductTemplatesList } from './ProductTemplatesList';

export type { ProductSheetMainTab } from '../types';

export interface ProductTemplatesWorkspaceProps {
  sheetTab: ProductSheetMainTab;
  onSheetTabChange: (tab: ProductSheetMainTab) => void;
  onEditModeChange?: ((editing: boolean) => void) | undefined;
}

export function ProductTemplatesWorkspace({
  sheetTab,
  onSheetTabChange,
  onEditModeChange,
}: ProductTemplatesWorkspaceProps) {
  // Séparé du workspace pour éviter de contaminer workspace avec une ref (react-hooks/refs)
  const { csvInputRef, openFilePicker, importFromFile } = useCsvTemplateImport();
  const workspace = useProductTemplatesWorkspace({
    onSheetTabChange,
    onEditModeChange,
    importFromCsvFile: importFromFile,
  });

  if (workspace.loading) {
    return (
      <p className="analyses-status" aria-busy="true">
        Chargement des fiches type…
      </p>
    );
  }

  if (workspace.loadError) {
    return (
      <p className="analyses-status analyses-status-error" role="alert">
        {workspace.loadError}
      </p>
    );
  }

  if (workspace.view.kind === 'edit') {
    return (
      <div className="product-templates-workspace w-full">
        <EditTemplateView
          templateName={workspace.templateName}
          onTemplateNameChange={workspace.setTemplateName}
          fieldRows={workspace.fieldRows}
          onFieldRowsChange={workspace.setFieldRows}
          refiningAi={workspace.refiningAi}
          refineDisabled={workspace.refineDisabled || workspace.saving}
          saving={workspace.saving}
          actionError={workspace.actionError}
          duplicateRowIds={workspace.editDuplicateRowIds}
          onRefine={() => void workspace.handleRefineEdit()}
          onSave={() => void workspace.handleSaveEdit()}
          onCancel={workspace.cancelEdit}
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
        {workspace.templates.length === 0 ? (
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
            templates={workspace.templates}
            onEdit={workspace.openEdit}
            onDelete={workspace.handleDeleteTemplate}
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
        {/* L'input fichier vit ici pour que la ref reste dans le composant qui la crée */}
        <input
          ref={csvInputRef}
          type="file"
          accept=".csv,text/csv"
          className="product-templates-csv-input-hidden"
          aria-hidden
          tabIndex={-1}
          onChange={(e) => void workspace.handleCsvFile(e.target.files?.[0] ?? null)}
        />
        <NewTemplatePanel
          shopReady={workspace.shopReady}
          actionError={workspace.actionError}
          onOpenManualModal={workspace.openManualModal}
          csvImport={{
            onFileSelected: (file) => void workspace.handleCsvFile(file),
            onOpenPicker: openFilePicker,
          }}
          urlAnalysis={{
            scrapeUrl: workspace.urlAnalysis.scrapeUrl,
            onScrapeUrlChange: workspace.urlAnalysis.setScrapeUrl,
            scraping: workspace.urlAnalysis.scraping,
            urlEmptyError: workspace.urlAnalysis.urlEmptyError,
            scrapeNotes: workspace.urlAnalysis.scrapeNotes,
            onAnalyze: () => void workspace.handleUrlAnalyze(),
          }}
          draftEditor={{
            draft: workspace.draft,
            onDraftChange: workspace.setDraft,
            refiningAi: workspace.refiningAi,
            refineDisabled: workspace.refineDisabled || workspace.draftSaving,
            saving: workspace.draftSaving,
            duplicateRowIds: workspace.draftDuplicateRowIds,
            onRefine: () => void workspace.handleRefineDraft(),
            onSave: () => void workspace.handleSaveDraft(),
            onCancel: workspace.handleCancelDraft,
          }}
          manualModal={{
            open: workspace.manualModalOpen,
            draft: workspace.manualDraft,
            onDraftChange: workspace.setManualDraft,
            saving: workspace.modalSaving,
            error: workspace.modalError,
            duplicateRowIds: workspace.manualDuplicateRowIds,
            onSave: () => void workspace.handleSaveManual(),
            onClose: workspace.closeManualModal,
          }}
        />
      </div>
    </div>
  );
}
