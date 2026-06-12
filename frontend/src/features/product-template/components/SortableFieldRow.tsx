import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { InputField } from '@shared/ui/InputField';
import { SelectField } from '@shared/ui/SelectField';
import type { ProductTemplateFieldType } from '@api/types/api.types';

import { PRODUCT_TEMPLATE_FIELD_TYPE_OPTIONS } from '../lib/productTemplates';
import type { TemplateFieldRow } from '../types';

export interface SortableFieldRowProps {
  row: TemplateFieldRow;
  isDuplicate: boolean;
  onPatch: (id: string, patch: Partial<TemplateFieldRow>) => void;
  onRemove: (id: string) => void;
}

export function SortableFieldRow({
  row,
  isDuplicate,
  onPatch,
  onRemove,
}: SortableFieldRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: row.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.85 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex flex-wrap items-end gap-2 rounded-xl border bg-bg-main px-3 py-2 ${
        isDuplicate ? 'border-red-400 bg-red-50/40' : 'border-soft'
      }`}
      data-dragging={isDragging ? 'true' : undefined}
    >
      <button
        type="button"
        className="h-9 w-8 cursor-grab rounded-lg border border-dashed border-soft bg-bg-white p-0 text-xs leading-none text-text-muted"
        aria-label="Réordonner"
        {...attributes}
        {...listeners}
      >
        ::
      </button>
      <InputField
        id={`field-name-${row.id}`}
        label="Nom du champ"
        value={row.name}
        aria-invalid={isDuplicate}
        error={isDuplicate ? 'Nom en doublon' : undefined}
        containerClassName="min-w-40 flex-1"
        labelClassName="text-xs font-semibold uppercase tracking-wide text-text-muted"
        inputClassName={
          isDuplicate
            ? 'border-red-400 focus:border-red-500'
            : 'border-soft focus:border-purple-400'
        }
        onChange={(e) => void onPatch(row.id, { name: e.target.value })}
      />
      <SelectField
        id={`field-type-${row.id}`}
        label="Type"
        value={row.type}
        containerClassName="min-w-28"
        labelClassName="text-xs font-semibold uppercase tracking-wide text-text-muted"
        onChange={(e) =>
          void onPatch(row.id, {
            type: e.target.value as ProductTemplateFieldType,
          })
        }
      >
        {PRODUCT_TEMPLATE_FIELD_TYPE_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </SelectField>
      <label className="mb-1 flex items-center gap-1.5 text-sm text-text-secondary">
        <input
          type="checkbox"
          checked={row.required}
          onChange={(e) => void onPatch(row.id, { required: e.target.checked })}
        />
        <span>Requis</span>
      </label>
      <button
        type="button"
        className="rounded-lg border border-soft bg-bg-white px-2.5 py-1.5 text-xs text-text-secondary hover:border-red-500 hover:text-red-500"
        onClick={() => void onRemove(row.id)}
      >
        Retirer
      </button>
    </div>
  );
}
