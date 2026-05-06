import { useMemo } from 'react';
import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PRODUCT_TEMPLATE_FIELD_TYPE_OPTIONS, type ProductTemplateFieldType } from '../lib/productTemplates';

export type TemplateFieldRow = {
  id: string;
  name: string;
  type: ProductTemplateFieldType;
  required: boolean;
};

function SortableFieldRow({
  row,
  onPatch,
  onRemove,
}: {
  row: TemplateFieldRow;
  onPatch: (id: string, patch: Partial<TemplateFieldRow>) => void;
  onRemove: (id: string) => void;
}) {
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
      className="flex flex-wrap items-end gap-2 rounded-xl border border-soft bg-bg-main px-3 py-2"
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
      <label className="flex min-w-40 flex-1 flex-col gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">Nom du champ</span>
        <input
          type="text"
          className="rounded-xl border border-soft bg-bg-white px-3 py-2 text-sm text-text-primary outline-none transition focus:border-purple-400 focus:shadow-[0_0_0_3px_rgba(168,85,247,0.2)]"
          value={row.name}
          onChange={(e) => onPatch(row.id, { name: e.target.value })}
        />
      </label>
      <label className="flex min-w-28 flex-col gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">Type</span>
        <select
          className="rounded-xl border border-soft bg-bg-white px-3 py-2 text-sm text-text-primary outline-none transition focus:border-purple-400 focus:shadow-[0_0_0_3px_rgba(168,85,247,0.2)]"
          value={row.type}
          onChange={(e) =>
            onPatch(row.id, {
              type: e.target.value as ProductTemplateFieldType,
            })
          }
        >
          {PRODUCT_TEMPLATE_FIELD_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>
      <label className="mb-1 flex items-center gap-1.5 text-sm text-text-secondary">
        <input
          type="checkbox"
          checked={row.required}
          onChange={(e) => onPatch(row.id, { required: e.target.checked })}
        />
        <span>Requis</span>
      </label>
      <button
        type="button"
        className="rounded-lg border border-soft bg-bg-white px-2.5 py-1.5 text-xs text-text-secondary hover:border-red-500 hover:text-red-500"
        onClick={() => onRemove(row.id)}
      >
        Retirer
      </button>
    </div>
  );
}

export type TemplateFieldsEditorProps = {
  rows: TemplateFieldRow[];
  onChange: (rows: TemplateFieldRow[]) => void;
};

export function TemplateFieldsEditor({ rows, onChange }: TemplateFieldsEditorProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const ids = useMemo(() => rows.map((r) => r.id), [rows]);

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = rows.findIndex((r) => r.id === active.id);
    const newIndex = rows.findIndex((r) => r.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    onChange(arrayMove(rows, oldIndex, newIndex));
  };

  const patchRow = (id: string, patch: Partial<TemplateFieldRow>) => {
    onChange(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const removeRow = (id: string) => {
    onChange(rows.filter((r) => r.id !== id));
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <div className="flex max-w-[52rem] flex-col gap-2.5">
          {rows.map((row) => (
            <SortableFieldRow key={row.id} row={row} onPatch={patchRow} onRemove={removeRow} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
