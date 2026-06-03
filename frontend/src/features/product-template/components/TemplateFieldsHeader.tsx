export interface TemplateRefineAction {
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export interface TemplateFieldsHeaderProps {
  onAddField: () => void;
  onRefine?: TemplateRefineAction;
}

export function TemplateFieldsHeader({ onAddField }: TemplateFieldsHeaderProps) {
  // TODO: affinage par IA — brancher onRefine quand l’action sera implémentée
  return (
    <div className="product-templates-fields-header">
      <h3 className="analyses-section-title">Champs</h3>
      <div className="product-templates-fields-header-actions">
        <button type="button" className="product-sheet-analyze-btn" onClick={onAddField}>
          Ajouter un champ
        </button>
      </div>
    </div>
  );
}
