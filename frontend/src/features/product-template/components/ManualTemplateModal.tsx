import { newRowId } from '../lib/templateFieldMappers';
import type { TemplateDraftState } from '../types';
import { TemplateFieldsEditor } from './TemplateFieldsEditor';
import { TemplateFieldsHeader } from './TemplateFieldsHeader';

export interface ManualTemplateModalProps {
  open: boolean;
  draft: TemplateDraftState;
  onDraftChange: (draft: TemplateDraftState) => void;
  saving: boolean;
  error: string | null;
  duplicateRowIds?: Set<string> | undefined;
  onSave: () => void;
  onClose: () => void;
}

export function ManualTemplateModal({
  open,
  draft,
  onDraftChange,
  saving,
  error,
  duplicateRowIds,
  onSave,
  onClose,
}: ManualTemplateModalProps) {
  if (!open) return null;

  return (
    <div
      className="product-template-modal-backdrop"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="product-template-modal w-full max-w-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-template-modal-title"
        onClick={(e) => void e.stopPropagation()}
      >
        <h2 id="product-template-modal-title" className="product-template-modal-title">
          Créer votre fiche à la main
        </h2>
        <label className="analyses-field">
          <span className="analyses-field-label">Nom de la fiche type</span>
          <input
            type="text"
            className="analyses-input"
            value={draft.templateName}
            onChange={(e) => void onDraftChange({ ...draft, templateName: e.target.value })}
          />
        </label>
        <TemplateFieldsHeader
          onAddField={() =>
            void onDraftChange({
              ...draft,
              fieldRows: [
                ...draft.fieldRows,
                { id: newRowId(), name: '', type: 'text', required: false },
              ],
            })
          }
        />
        <TemplateFieldsEditor
          rows={draft.fieldRows}
          onChange={(fieldRows) => void onDraftChange({ ...draft, fieldRows })}
          duplicateRowIds={duplicateRowIds}
        />
        {error ? (
          <p className="analyses-status analyses-status-error" role="alert">
            {error}
          </p>
        ) : null}
        <div className="product-template-modal-actions">
          <button
            type="button"
            className="product-sheet-save-btn"
            disabled={saving}
            onClick={onSave}
          >
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
          <button
            type="button"
            className="product-templates-draft-cancel"
            disabled={saving}
            onClick={onClose}
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}
