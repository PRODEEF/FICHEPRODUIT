import { newRowId } from '../lib/templateFieldMappers';
import type { TemplateFieldRow } from '../types';
import { TemplateFieldsEditor } from './TemplateFieldsEditor';
import { TemplateFieldsHeader } from './TemplateFieldsHeader';

export interface EditTemplateViewProps {
  templateName: string;
  onTemplateNameChange: (name: string) => void;
  fieldRows: TemplateFieldRow[];
  onFieldRowsChange: (rows: TemplateFieldRow[]) => void;
  refiningAi: boolean;
  refineDisabled: boolean;
  saving: boolean;
  actionError: string | null;
  duplicateRowIds?: Set<string> | undefined;
  onRefine: () => void;
  onSave: () => void;
  onCancel: () => void;
}

export function EditTemplateView({
  templateName,
  onTemplateNameChange,
  fieldRows,
  onFieldRowsChange,
  refiningAi,
  refineDisabled,
  saving,
  actionError,
  duplicateRowIds,
  onRefine,
  onSave,
  onCancel,
}: EditTemplateViewProps) {
  return (
    <>
      <button type="button" className="product-templates-back" onClick={onCancel}>
        Annuler
      </button>

      <label className="analyses-field">
        <span className="analyses-field-label">Nom de la fiche type</span>
        <input
          type="text"
          className="analyses-input"
          value={templateName}
          onChange={(e) => void onTemplateNameChange(e.target.value)}
        />
      </label>

      <TemplateFieldsHeader
        onRefine={{
          onClick: onRefine,
          loading: refiningAi,
          disabled: refineDisabled,
        }}
        onAddField={() =>
          void onFieldRowsChange([
            ...fieldRows,
            { id: newRowId(), name: '', type: 'text', required: false },
          ])
        }
      />
      <TemplateFieldsEditor
        rows={fieldRows}
        onChange={onFieldRowsChange}
        duplicateRowIds={duplicateRowIds}
      />

      {actionError ? (
        <p className="analyses-status analyses-status-error" role="alert">
          {actionError}
        </p>
      ) : null}

      <div className="product-sheet-actions">
        <button
          type="button"
          className="product-sheet-save-btn"
          disabled={saving}
          onClick={onSave}
        >
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>
    </>
  );
}
