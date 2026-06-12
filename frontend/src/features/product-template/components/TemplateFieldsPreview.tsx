import type { ProductTemplateField } from '@types-api';

import { productTemplateFieldTypeLabel } from '../lib/productTemplates';

export interface TemplateFieldsPreviewProps {
  fields: ProductTemplateField[];
  templateId: string;
}

export function TemplateFieldsPreview({ fields, templateId }: TemplateFieldsPreviewProps) {
  return (
    <div className="product-templates-preview-wrap">
      <table className="product-templates-preview-table">
        <thead>
          <tr>
            <th>Nom</th>
            <th>Type</th>
            <th>Requis</th>
          </tr>
        </thead>
        <tbody>
          {fields.map((field) => (
            <tr key={`${templateId}-${field.name}-${field.type}-${field.order}`}>
              <td className="product-templates-preview-name">{field.name}</td>
              <td>{productTemplateFieldTypeLabel(field.type)}</td>
              <td>
                <span
                  className={`product-templates-preview-badge ${
                    field.required
                      ? 'product-templates-preview-badge--yes'
                      : 'product-templates-preview-badge--no'
                  }`}
                >
                  {field.required ? 'Oui' : 'Non'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
