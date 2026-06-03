import { newRowId } from '../lib/templateFieldMappers';
import type { TemplateDraftState } from '../types';
import { TemplateFieldsEditor } from './TemplateFieldsEditor';
import { TemplateFieldsHeader } from './TemplateFieldsHeader';

export interface TemplateDraftEditorProps {
  draft: TemplateDraftState;
  onDraftChange: (draft: TemplateDraftState) => void;
  refiningAi: boolean;
  refineDisabled: boolean;
  saving: boolean;
  onRefine: () => void;
  onSave: () => void;
  onCancel: () => void;
}

export function TemplateDraftEditor({
  draft,
  onDraftChange,
  refiningAi,
  refineDisabled,
  saving,
  onRefine,
  onSave,
  onCancel,
}: TemplateDraftEditorProps) {
  return (
    <div className="product-templates-draft">
      <label className="analyses-field">
        <span className="analyses-field-label">Nom de la fiche type</span>
        <input
          type="text"
          className="analyses-input"
          value={draft.templateName}
          onChange={(e) =>
            void onDraftChange({ ...draft, templateName: e.target.value })
          }
        />
      </label>
      <TemplateFieldsHeader
        onRefine={{
          onClick: onRefine,
          loading: refiningAi,
          disabled: refineDisabled,
        }}
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
      />
      <div className="product-templates-draft-actions">
        <button
          type="button"
          className="product-sheet-save-btn"
          disabled={saving}
          onClick={onSave}
        >
          {saving ? 'Enregistrement…' : 'Enregistrer la fiche'}
        </button>
        <button
          type="button"
          className="product-templates-draft-cancel"
          disabled={saving}
          onClick={onCancel}
        >
          Abandonner
        </button>
      </div>
    </div>
  );
}
