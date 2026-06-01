import type { ProductTemplate } from '@types-api';

import { productTemplateFieldTypeLabel } from '../lib/productTemplates';

export interface ProductTemplatesListProps {
  templates: ProductTemplate[];
  onEdit: (template: ProductTemplate) => void;
}

export function ProductTemplatesList({ templates, onEdit }: ProductTemplatesListProps) {
  if (templates.length === 0) {
    return null;
  }

  return (
    <ul className="product-templates-list">
      <p className="product-sheet-intro product-templates-new-fiche-intro">
        Retrouvez et gérez vos fiches produit types.
      </p>
      {templates.map((t) => (
        <li key={t.id} className="product-templates-card">
          <div className="product-templates-card-head">
            <div>
              <h3 className="product-templates-card-title">{t.name}</h3>
              <p className="product-templates-card-meta">
                {t.fields.length} champ{t.fields.length > 1 ? 's' : ''} ·{' '}
                {new Date(t.updatedAt).toLocaleString()}
              </p>
            </div>
            <button
              type="button"
              className="product-sheet-analyze-btn"
              onClick={() => void onEdit(t)}
            >
              Modifier
            </button>
          </div>
          <div className="analyses-table-wrap product-templates-card-table">
            <table className="analyses-table">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Type</th>
                  <th>Requis</th>
                </tr>
              </thead>
              <tbody>
                {t.fields.map((f) => (
                  <tr key={`${t.id}-${f.name}-${f.type}`}>
                    <td>{f.name}</td>
                    <td>{productTemplateFieldTypeLabel(f.type)}</td>
                    <td>{f.required ? 'Oui' : 'Non'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </li>
      ))}
    </ul>
  );
}
