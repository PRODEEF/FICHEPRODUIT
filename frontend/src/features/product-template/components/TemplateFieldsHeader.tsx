export interface TemplateFieldsHeaderProps {
  refiningAi: boolean;
  refineDisabled: boolean;
  onRefine?: () => void;
  onAddField: () => void;
  showRefine?: boolean;
}

export function TemplateFieldsHeader({
  refiningAi,
  refineDisabled,
  onRefine,
  onAddField,
  showRefine = true,
}: TemplateFieldsHeaderProps) {
  return (
    <div className="product-templates-fields-header">
      <h3 className="analyses-section-title">Champs</h3>
      <div className="product-templates-fields-header-actions">
        {/* {showRefine && onRefine ? (
          <button
            type="button"
            className="product-sheet-analyze-btn"
            disabled={refineDisabled || refiningAi}
            onClick={onRefine}
          >
            {refiningAi ? 'IA…' : 'Affiner avec l’IA'}
          </button>
        ) : null} */}
        <button type="button" className="product-sheet-analyze-btn" onClick={onAddField}>
          Ajouter un champ
        </button>
      </div>
    </div>
  );
}
