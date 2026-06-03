import { useState } from 'react';
import { ChevronDown, Trash2 } from 'lucide-react';
import type { ProductTemplate } from '@types-api';

import { productTemplateFieldTypeLabel } from '../lib/productTemplates';
import { DeleteTemplateConfirmModal } from './DeleteTemplateConfirmModal';

export interface ProductTemplatesListProps {
  templates: ProductTemplate[];
  onEdit: (template: ProductTemplate) => void;
  onDelete: (template: ProductTemplate) => Promise<void>;
}

export function ProductTemplatesList({ templates, onEdit, onDelete }: ProductTemplatesListProps) {
  const [expandedTemplateIds, setExpandedTemplateIds] = useState<Set<string>>(new Set());
  const [templateToDelete, setTemplateToDelete] = useState<ProductTemplate | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const toggleTemplatePreview = (templateId: string): void => {
    setExpandedTemplateIds((prev) => {
      const next = new Set(prev);
      if (next.has(templateId)) {
        next.delete(templateId);
      } else {
        next.add(templateId);
      }
      return next;
    });
  };

  const closeDeleteModal = (): void => {
    if (deleting) return;
    setTemplateToDelete(null);
    setDeleteError(null);
  };

  const confirmDelete = async (): Promise<void> => {
    if (!templateToDelete) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await onDelete(templateToDelete);
      setExpandedTemplateIds((prev) => {
        const next = new Set(prev);
        next.delete(templateToDelete.id);
        return next;
      });
      setTemplateToDelete(null);
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : 'Suppression impossible.');
    } finally {
      setDeleting(false);
    }
  };

  if (templates.length === 0) {
    return null;
  }

  return (
    <>
    <DeleteTemplateConfirmModal
      open={templateToDelete !== null}
      templateName={templateToDelete?.name ?? ''}
      deleting={deleting}
      error={deleteError}
      onConfirm={() => void confirmDelete()}
      onClose={closeDeleteModal}
    />
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
            <div className="product-templates-card-actions inline-flex items-stretch gap-1">
              <button
                type="button"
                className="product-sheet-analyze-btn"
                onClick={() => void onEdit(t)}
              >
                Modifier
              </button>
              <button
                type="button"
                className="product-sheet-analyze-btn gap-1.5"
                onClick={() => toggleTemplatePreview(t.id)}
                aria-expanded={expandedTemplateIds.has(t.id)}
                aria-controls={`template-preview-${t.id}`}
              >
                Aperçu
                <ChevronDown
                  size={16}
                  className={`transition-transform duration-200 ${
                    expandedTemplateIds.has(t.id) ? 'rotate-180' : 'rotate-0'
                  }`}
                  aria-hidden="true"
                />
              </button>
              <button
                type="button"
                className="product-sheet-analyze-btn product-sheet-analyze-btn--danger product-sheet-analyze-btn--icon-only"
                aria-label={`Supprimer la fiche ${t.name}`}
                title="Supprimer la fiche"
                onClick={() => {
                  setDeleteError(null);
                  setTemplateToDelete(t);
                }}
              >
                <Trash2 size={16} aria-hidden="true" />
              </button>
            </div>
          </div>
          <div
            id={`template-preview-${t.id}`}
            className={`overflow-hidden transition-all duration-200 ease-out ${
              expandedTemplateIds.has(t.id)
                ? 'max-h-[9999px] opacity-100'
                : 'max-h-0 opacity-0'
            }`}
          >
            <div className="analyses-table-wrap product-templates-card-table pt-1">
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
          </div>
        </li>
      ))}
    </ul>
    </>
  );
}
