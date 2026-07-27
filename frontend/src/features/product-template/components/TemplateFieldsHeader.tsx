import type { TemplateRefineAction } from '../types';

export interface TemplateFieldsHeaderProps {
  onAddField: () => void;
  onRefine?: TemplateRefineAction;
}

export function TemplateFieldsHeader({ onAddField, onRefine }: TemplateFieldsHeaderProps) {
  return (
    <div className="product-templates-fields-header">
      <h3 className="analyses-section-title">Champs</h3>
      <div className="product-templates-fields-header-actions">
        {onRefine ? (
          <button
            type="button"
            className="product-sheet-analyze-btn"
            onClick={onRefine.onClick}
            disabled={(onRefine.disabled ?? false) || (onRefine.loading ?? false)}
          >
            {onRefine.loading ? 'Affinage…' : 'Affiner par IA'}
          </button>
        ) : null}
        <button type="button" className="product-sheet-analyze-btn" onClick={onAddField}>
          Ajouter un champ
        </button>
      </div>
    </div>
  );
}
