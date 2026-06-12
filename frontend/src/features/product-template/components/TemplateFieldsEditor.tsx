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
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

import type { TemplateFieldRow } from '../types';
import { SortableFieldRow } from './SortableFieldRow';

export interface TemplateFieldsEditorProps {
  rows: TemplateFieldRow[];
  onChange: (rows: TemplateFieldRow[]) => void;
  duplicateRowIds?: Set<string> | undefined;
}

export function TemplateFieldsEditor({
  rows,
  onChange,
  duplicateRowIds,
}: TemplateFieldsEditorProps) {
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

  const hasDuplicates = duplicateRowIds !== undefined && duplicateRowIds.size > 0;

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <div className="flex w-full flex-col gap-2.5">
          {rows.map((row) => (
            <SortableFieldRow
              key={row.id}
              row={row}
              isDuplicate={duplicateRowIds?.has(row.id) ?? false}
              onPatch={patchRow}
              onRemove={removeRow}
            />
          ))}
        </div>
      </SortableContext>
      {hasDuplicates ? (
        <p className="mt-2 text-sm text-red-600" role="alert">
          Certains champs ont le même nom. Renommez-les avant d&apos;enregistrer.
        </p>
      ) : null}
    </DndContext>
  );
}
