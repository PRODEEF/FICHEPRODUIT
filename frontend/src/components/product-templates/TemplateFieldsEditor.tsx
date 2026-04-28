import { useMemo } from 'react'
import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { PRODUCT_TEMPLATE_FIELD_TYPE_OPTIONS } from '../../lib/productTemplateFieldLabels'
import type { ProductTemplateFieldType } from '../../lib/productTemplateTypes'

export type TemplateFieldRow = {
  id: string
  name: string
  type: ProductTemplateFieldType
  required: boolean
}

function SortableFieldRow({
  row,
  onPatch,
  onRemove,
}: {
  row: TemplateFieldRow
  onPatch: (id: string, patch: Partial<TemplateFieldRow>) => void
  onRemove: (id: string) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: row.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.85 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="template-field-row"
      data-dragging={isDragging ? 'true' : undefined}
    >
      <button
        type="button"
        className="template-field-drag"
        aria-label="Réordonner"
        {...attributes}
        {...listeners}
      >
        ::
      </button>
      <label className="analyses-field template-field-name">
        <span className="analyses-field-label">Nom du champ</span>
        <input
          type="text"
          className="analyses-input"
          value={row.name}
          onChange={(e) => onPatch(row.id, { name: e.target.value })}
        />
      </label>
      <label className="analyses-field template-field-type">
        <span className="analyses-field-label">Type</span>
        <select
          className="analyses-input"
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
      <label className="template-field-required">
        <input
          type="checkbox"
          checked={row.required}
          onChange={(e) => onPatch(row.id, { required: e.target.checked })}
        />
        <span>Requis</span>
      </label>
      <button
        type="button"
        className="template-field-remove"
        onClick={() => onRemove(row.id)}
      >
        Retirer
      </button>
    </div>
  )
}

export type TemplateFieldsEditorProps = {
  rows: TemplateFieldRow[]
  onChange: (rows: TemplateFieldRow[]) => void
}

export function TemplateFieldsEditor({
  rows,
  onChange,
}: TemplateFieldsEditorProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const ids = useMemo(() => rows.map((r) => r.id), [rows])

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = rows.findIndex((r) => r.id === active.id)
    const newIndex = rows.findIndex((r) => r.id === over.id)
    if (oldIndex < 0 || newIndex < 0) return
    onChange(arrayMove(rows, oldIndex, newIndex))
  }

  const patchRow = (id: string, patch: Partial<TemplateFieldRow>) => {
    onChange(
      rows.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    )
  }

  const removeRow = (id: string) => {
    onChange(rows.filter((r) => r.id !== id))
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <div className="template-fields-editor">
          {rows.map((row) => (
            <SortableFieldRow
              key={row.id}
              row={row}
              onPatch={patchRow}
              onRemove={removeRow}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
