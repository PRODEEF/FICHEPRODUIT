export type TemplateRefineAction = {
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
};

export interface TemplateFieldsHeaderProps {
  onAddField: () => void;
  onRefine?: TemplateRefineAction;
}

export function TemplateFieldsHeader({ onAddField, onRefine }: TemplateFieldsHeaderProps) {
  const todo = false; // TODO: l'affinage par IA n'est pas implémenté

  return (
    <div className="product-templates-fields-header">
      <h3 className="analyses-section-title">Champs</h3>
      <div className="product-templates-fields-header-actions">
        {onRefine && todo ? (
          <button
            type="button"
            className="product-sheet-analyze-btn"
            disabled={(onRefine.disabled ?? false) || (onRefine.loading ?? false)}
            onClick={onRefine.onClick}
          >
            {onRefine.loading ? 'IA…' : 'Affiner avec l’IA'}
          </button>
        ) : null}
        <button type="button" className="product-sheet-analyze-btn" onClick={onAddField}>
          Ajouter un champ
        </button>
      </div>
    </div>
  );
}
