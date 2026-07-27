import type {
  NewTemplateCsvImport,
  NewTemplateDraftEditor,
  NewTemplateManualModal,
  NewTemplateUrlAnalysis,
} from '../types';
import { ManualTemplateModal } from './ManualTemplateModal';
import { ProductUrlAnalyzeForm } from './ProductUrlAnalyzeForm';
import { TemplateDraftEditor } from './TemplateDraftEditor';

export interface NewTemplatePanelProps {
  shopReady: boolean;
  actionError: string | null;
  onOpenManualModal: () => void;
  csvImport: NewTemplateCsvImport;
  urlAnalysis: NewTemplateUrlAnalysis;
  draftEditor: NewTemplateDraftEditor;
  manualModal: NewTemplateManualModal;
}

export function NewTemplatePanel({
  shopReady,
  actionError,
  onOpenManualModal,
  csvImport,
  urlAnalysis,
  draftEditor,
  manualModal,
}: NewTemplatePanelProps) {
  return (
    <section
      className="product-templates-new-fiche w-full"
      aria-labelledby="product-templates-new-fiche-title"
    >
      <p className="product-sheet-intro product-templates-new-fiche-intro max-w-none">
        Importez un CSV PrestaShop, analysez une URL produit ou créez vos champs à la main.
      </p>

      <h2 id="product-templates-new-fiche-title" className="product-templates-new-fiche-title">
        Nouvelle fiche
      </h2>

      {!shopReady ? (
        <p className="analyses-status" role="status">
          Analysez d’abord votre site depuis le catalogue pour activer l’analyse par URL.
        </p>
      ) : null}

      <div className="flex w-full flex-wrap items-start gap-4">
        <button
          type="button"
          className="product-templates-csv-btn shrink-0"
          onClick={csvImport.onOpenPicker}
          disabled={!shopReady}
        >
          Importer CSV
        </button>

        <ProductUrlAnalyzeForm
          scrapeUrl={urlAnalysis.scrapeUrl}
          onScrapeUrlChange={urlAnalysis.onScrapeUrlChange}
          scraping={urlAnalysis.scraping}
          urlEmptyError={urlAnalysis.urlEmptyError}
          disabled={!shopReady}
          onSubmit={urlAnalysis.onAnalyze}
        />
      </div>

      {urlAnalysis.scrapeNotes ? (
        <p className="product-templates-scrape-notes">{urlAnalysis.scrapeNotes}</p>
      ) : null}

      <button
        type="button"
        className="product-templates-manual-cta"
        onClick={onOpenManualModal}
        disabled={!shopReady}
      >
        Créer votre fiche à la main
      </button>

      {actionError ? (
        <p className="analyses-status analyses-status-error" role="alert">
          {actionError}
        </p>
      ) : null}

      {draftEditor.draft ? (
        <TemplateDraftEditor
          draft={draftEditor.draft}
          onDraftChange={draftEditor.onDraftChange}
          refiningAi={draftEditor.refiningAi}
          refineDisabled={draftEditor.refineDisabled}
          saving={draftEditor.saving}
          duplicateRowIds={draftEditor.duplicateRowIds}
          onRefine={draftEditor.onRefine}
          onSave={draftEditor.onSave}
          onCancel={draftEditor.onCancel}
        />
      ) : null}

      <ManualTemplateModal
        open={manualModal.open}
        draft={manualModal.draft}
        onDraftChange={manualModal.onDraftChange}
        saving={manualModal.saving}
        error={manualModal.error}
        duplicateRowIds={manualModal.duplicateRowIds}
        onSave={manualModal.onSave}
        onClose={manualModal.onClose}
      />
    </section>
  );
}
