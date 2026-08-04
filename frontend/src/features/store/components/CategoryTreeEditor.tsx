import { useCallback, useId, useState, type KeyboardEvent } from 'react';
import { Plus } from 'lucide-react';

import type { ShopCategoryNode } from '@types-api';
import { apiErrorMessage } from '@lib/apiErrorMessage';
import { Button } from '@shared/ui';

import {
  SHOP_CATEGORY_MAX_DEPTH,
  SHOP_CATEGORY_MAX_NODES,
  addChildNode,
  categoryDuplicateMessage,
  countCategoryNodes,
  createCategoryNode,
  findSiblingDuplicateName,
  getSiblings,
  removeCategoryNode,
  shopCategoryNameSchema,
  updateNodeName,
} from '../lib/categoryTreeSchemas';
import { collectIds } from '../lib/collectIds';
import { CategoryDeleteModal } from './CategoryDeleteModal';
import { CategoryInlineAddForm } from './CategoryInlineAddForm';
import { CategoryTreeNode } from './CategoryTreeNode';

interface CategoryTreeEditorProps {
  tree: ShopCategoryNode[];
  disabled?: boolean;
  onChange: (next: ShopCategoryNode[]) => void | Promise<void>;
}

interface PendingAdd {
  parentId: string | null;
  depth: number;
}

export function CategoryTreeEditor({ tree, disabled = false, onChange }: CategoryTreeEditorProps) {
  const baseId = useId();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set(collectIds(tree)));
  const [pendingAdd, setPendingAdd] = useState<PendingAdd | null>(null);
  const [addInput, setAddInput] = useState('');
  const [addError, setAddError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editInput, setEditInput] = useState('');
  const [editError, setEditError] = useState<string | null>(null);
  const [nodeToDelete, setNodeToDelete] = useState<ShopCategoryNode | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTooltipId, setActiveTooltipId] = useState<string | null>(null);

  const locked = disabled || busy;
  const canAddRoot = !locked && countCategoryNodes(tree) < SHOP_CATEGORY_MAX_NODES;
  const showEmptyState = tree.length === 0 && pendingAdd === null;

  const toggleExpanded = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const persist = async (next: ShopCategoryNode[]) => {
    setBusy(true);
    setError(null);
    try {
      await onChange(next);
    } catch (e) {
      setError(apiErrorMessage(e, 'Impossible d’enregistrer les catégories.'));
      throw e;
    } finally {
      setBusy(false);
    }
  };

  const openAdd = (parentId: string | null, depth: number) => {
    if (locked) return;
    if (countCategoryNodes(tree) >= SHOP_CATEGORY_MAX_NODES) {
      setError(`Maximum ${SHOP_CATEGORY_MAX_NODES} catégories autorisées.`);
      return;
    }
    if (depth > SHOP_CATEGORY_MAX_DEPTH) return;
    setPendingAdd({ parentId, depth });
    setAddInput('');
    setAddError(null);
    setError(null);
    setEditingId(null);
  };

  const cancelAdd = () => {
    setPendingAdd(null);
    setAddInput('');
    setAddError(null);
  };

  const submitAdd = async () => {
    if (!pendingAdd || locked) return;
    setAddError(null);

    const parsed = shopCategoryNameSchema.safeParse(addInput);
    if (!parsed.success) {
      setAddError(parsed.error.issues[0]?.message ?? 'Valeur invalide.');
      return;
    }

    const siblings = getSiblings(tree, pendingAdd.parentId);
    const duplicate = findSiblingDuplicateName(siblings, parsed.data);
    if (duplicate) {
      setAddError(categoryDuplicateMessage(duplicate));
      return;
    }

    const node = createCategoryNode(parsed.data);
    const next = addChildNode(tree, pendingAdd.parentId, node);
    try {
      await persist(next);
      if (pendingAdd.parentId) {
        const parentId = pendingAdd.parentId;
        setExpandedIds((prev) => new Set(prev).add(parentId));
      }
      setPendingAdd(null);
      setAddInput('');
    } catch {
      /* erreur déjà affichée par persist() */
    }
  };

  const startRename = (node: ShopCategoryNode) => {
    if (locked) return;
    setPendingAdd(null);
    setEditingId(node.id);
    setEditInput(node.name);
    setEditError(null);
  };

  const submitRename = async (nodeId: string, parentId: string | null) => {
    if (locked || editingId !== nodeId) return;
    setEditError(null);

    const parsed = shopCategoryNameSchema.safeParse(editInput);
    if (!parsed.success) {
      setEditError(parsed.error.issues[0]?.message ?? 'Valeur invalide.');
      return;
    }

    const siblings = getSiblings(tree, parentId);
    const duplicate = findSiblingDuplicateName(siblings, parsed.data, nodeId);
    if (duplicate) {
      setEditError(categoryDuplicateMessage(duplicate));
      return;
    }

    if (parsed.data === siblings.find((s) => s.id === nodeId)?.name) {
      setEditingId(null);
      return;
    }

    try {
      await persist(updateNodeName(tree, nodeId, parsed.data));
      setEditingId(null);
    } catch {
      /* erreur déjà affichée par persist() */
    }
  };

  const confirmDelete = async () => {
    if (!nodeToDelete || locked) return;
    try {
      await persist(removeCategoryNode(tree, nodeToDelete.id));
      setNodeToDelete(null);
    } catch {
      /* erreur déjà affichée par persist() */
    }
  };

  const onAddKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      void submitAdd();
    }
    if (e.key === 'Escape') {
      cancelAdd();
    }
  };

  const pendingAddForm =
    pendingAdd !== null ? (
      <CategoryInlineAddForm
        id={`${baseId}-add`}
        depth={pendingAdd.depth}
        value={addInput}
        error={addError}
        locked={locked}
        onChange={(v) => {
          setAddError(null);
          setAddInput(v);
        }}
        onKeyDown={onAddKeyDown}
        onSubmit={() => {
          void submitAdd();
        }}
        onCancel={cancelAdd}
      />
    ) : null;

  return (
    <section className="mt-8 rounded-xl border border-gray-100 bg-bg-white px-5 py-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="m-0 text-base font-medium text-text-primary">Catégories</h2>
        <Button
          type="button"
          variant="neutral-outline"
          size="sm"
          disabled={!canAddRoot}
          onClick={() => {
            openAdd(null, 1);
          }}
          aria-label="Ajouter une catégorie"
          className="h-8 gap-1.5 !px-3 !py-0 text-sm font-medium"
        >
          <Plus className="h-4 w-4 shrink-0" aria-hidden />
          Ajouter
        </Button>
      </div>

      {showEmptyState ? (
        <div className="flex flex-col items-center justify-center gap-2 px-4 py-10 text-center">
          <p className="m-0 text-sm font-medium text-text-primary">Créez votre arborescence</p>
          <p className="m-0 max-w-sm text-sm text-text-secondary">
            Organisez vos produits en catégories et sous-catégories pour faciliter le classement
          </p>
          <Button
            type="button"
            variant="neutral-outline"
            size="sm"
            disabled={!canAddRoot}
            onClick={() => {
              openAdd(null, 1);
            }}
            className="mt-2 h-8 gap-1.5 !px-3 !py-0 text-sm font-medium"
          >
            <Plus className="h-4 w-4 shrink-0" aria-hidden />
            Ajouter
          </Button>
        </div>
      ) : (
        <ul className="m-0 list-none p-0" role="tree" aria-label="Arborescence des catégories">
          {pendingAdd?.parentId === null ? pendingAddForm : null}
          {tree.map((node) => (
            <CategoryTreeNode
              key={node.id}
              node={node}
              parentId={null}
              depth={1}
              expandedIds={expandedIds}
              editingId={editingId}
              editInput={editInput}
              editError={editError}
              locked={locked}
              pendingAddParentId={pendingAdd?.parentId ?? null}
              pendingAddForm={pendingAddForm}
              activeTooltipId={activeTooltipId}
              onActiveTooltipChange={setActiveTooltipId}
              onToggle={toggleExpanded}
              onStartRename={startRename}
              onEditInputChange={(v) => {
                setEditError(null);
                setEditInput(v);
              }}
              onSubmitRename={(id, parentId) => {
                void submitRename(id, parentId);
              }}
              onCancelRename={() => {
                setEditingId(null);
              }}
              onDelete={(n) => {
                setNodeToDelete(n);
              }}
              onAddChild={(id, depth) => {
                openAdd(id, depth + 1);
              }}
            />
          ))}
        </ul>
      )}

      {error ? (
        <p className="mt-2 text-sm text-red-500" role="alert">
          {error}
        </p>
      ) : null}

      <CategoryDeleteModal
        nodeToDelete={nodeToDelete}
        busy={busy}
        onClose={() => {
          setNodeToDelete(null);
        }}
        onConfirm={() => void confirmDelete()}
      />
    </section>
  );
}
