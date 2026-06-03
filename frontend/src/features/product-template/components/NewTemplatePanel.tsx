import type { TemplateDraftState } from '../types';
import { ManualTemplateModal } from './ManualTemplateModal';
import { ProductUrlAnalyzeForm } from './ProductUrlAnalyzeForm';
import { TemplateDraftEditor } from './TemplateDraftEditor';

export interface NewTemplatePanelProps {
  shopReady: boolean;
  csvInputRef: React.RefObject<HTMLInputElement | null>;
  onCsvFileSelected: (file: File | null) => void;
  onOpenCsvPicker: () => void;
  scrapeUrl: string;
  onScrapeUrlChange: (value: string) => void;
  scraping: boolean;
  urlEmptyError: boolean;
  scrapeNotes: string | null;
  onUrlAnalyze: () => void;
  onOpenManualModal: () => void;
  actionError: string | null;
  draft: TemplateDraftState | null;
  onDraftChange: (draft: TemplateDraftState) => void;
  refiningAi: boolean;
  refineDisabled: boolean;
  draftSaving: boolean;
  onRefineDraft: () => void;
  onSaveDraft: () => void;
  onCancelDraft: () => void;
  manualModalOpen: boolean;
  manualDraft: TemplateDraftState;
  onManualDraftChange: (draft: TemplateDraftState) => void;
  modalSaving: boolean;
  modalError: string | null;
  onSaveManual: () => void;
  onCloseManual: () => void;
}

export function NewTemplatePanel({
  shopReady,
  csvInputRef,
  onCsvFileSelected,
  onOpenCsvPicker,
  scrapeUrl,
  onScrapeUrlChange,
  scraping,
  urlEmptyError,
  scrapeNotes,
  onUrlAnalyze,
  onOpenManualModal,
  actionError,
  draft,
  onDraftChange,
  refiningAi,
  refineDisabled,
  draftSaving,
  onRefineDraft,
  onSaveDraft,
  onCancelDraft,
  manualModalOpen,
  manualDraft,
  onManualDraftChange,
  modalSaving,
  modalError,
  onSaveManual,
  onCloseManual,
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
        <input
          ref={csvInputRef}
          type="file"
          accept=".csv,text/csv"
          className="product-templates-csv-input-hidden"
          aria-hidden
          tabIndex={-1}
          onChange={(e) => void onCsvFileSelected(e.target.files?.[0] ?? null)}
        />
        <button
          type="button"
          className="product-templates-csv-btn shrink-0"
          onClick={onOpenCsvPicker}
          disabled={!shopReady}
        >
          Importer CSV
        </button>

        <ProductUrlAnalyzeForm
          scrapeUrl={scrapeUrl}
          onScrapeUrlChange={onScrapeUrlChange}
          scraping={scraping}
          urlEmptyError={urlEmptyError}
          disabled={!shopReady}
          onSubmit={onUrlAnalyze}
        />
      </div>

      {scrapeNotes ? <p className="product-templates-scrape-notes">{scrapeNotes}</p> : null}

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

      {draft ? (
        <TemplateDraftEditor
          draft={draft}
          onDraftChange={onDraftChange}
          refiningAi={refiningAi}
          refineDisabled={refineDisabled}
          saving={draftSaving}
          onRefine={onRefineDraft}
          onSave={onSaveDraft}
          onCancel={onCancelDraft}
        />
      ) : null}

      <ManualTemplateModal
        open={manualModalOpen}
        draft={manualDraft}
        onDraftChange={onManualDraftChange}
        saving={modalSaving}
        error={modalError}
        onSave={onSaveManual}
        onClose={onCloseManual}
      />
    </section>
  );
}
