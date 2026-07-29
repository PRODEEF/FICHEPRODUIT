import { useCallback, useId, useState, type KeyboardEvent, type ReactNode } from 'react';
import { ChevronDown, ChevronRight, MoreHorizontal, Pencil, Plus, Trash2, X } from 'lucide-react';

import type { ShopCategoryNode } from '@types-api';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  InputField,
  Modal,
} from '@shared/ui';

import {
  SHOP_CATEGORY_MAX_DEPTH,
  SHOP_CATEGORY_MAX_NODES,
  SHOP_CATEGORY_NAME_MAX_LENGTH,
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

interface CategoryTreeEditorProps {
  tree: ShopCategoryNode[];
  disabled?: boolean;
  onChange: (next: ShopCategoryNode[]) => void | Promise<void>;
}

interface PendingAdd {
  parentId: string | null;
  depth: number;
}

const CHAR_COUNT_VISIBLE_FROM = 50;

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
      setError(e instanceof Error ? e.message : 'Impossible d’enregistrer les catégories.');
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
      /* erreur déjà affichée */
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
      /* erreur déjà affichée */
    }
  };

  const confirmDelete = async () => {
    if (!nodeToDelete || locked) return;
    try {
      await persist(removeCategoryNode(tree, nodeToDelete.id));
      setNodeToDelete(null);
    } catch {
      /* erreur déjà affichée */
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
            <CategoryTreeNodeRow
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

      <Modal
        open={nodeToDelete !== null}
        title="Confirmer la suppression"
        onClose={() => {
          if (!busy) setNodeToDelete(null);
        }}
      >
        <h2 className="m-0 text-lg font-semibold text-text-primary">Supprimer cette catégorie ?</h2>
        <p className="mt-2 text-sm text-text-secondary">
          {nodeToDelete ? (
            <>
              La catégorie{' '}
              <span className="font-medium text-text-primary">« {nodeToDelete.name} »</span>
              {nodeToDelete.children.length > 0
                ? ' et toutes ses sous-catégories seront retirées.'
                : ' sera retirée de l’arborescence.'}
            </>
          ) : null}
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button
            type="button"
            variant="neutral-outline"
            size="sm"
            disabled={busy}
            onClick={() => {
              setNodeToDelete(null);
            }}
          >
            Annuler
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            disabled={busy}
            onClick={() => void confirmDelete()}
          >
            {busy ? 'Suppression…' : 'Supprimer'}
          </Button>
        </div>
      </Modal>
    </section>
  );
}

interface CategoryInlineAddFormProps {
  id: string;
  depth: number;
  value: string;
  error: string | null;
  locked: boolean;
  onChange: (value: string) => void;
  onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

function CategoryInlineAddForm({
  id,
  depth,
  value,
  error,
  locked,
  onChange,
  onKeyDown,
  onSubmit,
  onCancel,
}: CategoryInlineAddFormProps) {
  return (
    <li className="list-none" role="none">
      <div className="flex h-auto min-h-9 items-center gap-1.5 border-b border-gray-100 py-1.5">
        <DepthGuides depth={depth} />
        <span className="inline-block w-[18px] shrink-0" aria-hidden />
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <InputField
            id={id}
            label="Nom de la catégorie"
            labelClassName="sr-only"
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
            }}
            onKeyDown={onKeyDown}
            placeholder="Nom de la catégorie"
            disabled={locked}
            maxLength={SHOP_CATEGORY_NAME_MAX_LENGTH}
            error={error ?? undefined}
            errorId={`${id}-error`}
            autoFocus
            containerClassName="min-w-[12rem] flex-1 gap-1"
            inputClassName="h-[30px] rounded-lg py-0"
          />
          {value.length >= CHAR_COUNT_VISIBLE_FROM ? (
            <span className="text-xs tabular-nums text-text-muted" aria-live="polite">
              {value.length}/{SHOP_CATEGORY_NAME_MAX_LENGTH}
            </span>
          ) : null}
          <Button
            type="button"
            variant="neutral-outline"
            size="sm"
            disabled={locked || value.trim() === ''}
            onClick={onSubmit}
            className="h-[30px] !px-3 !py-0 text-sm"
          >
            Ajouter
          </Button>
          <button
            type="button"
            disabled={locked}
            onClick={onCancel}
            aria-label="Annuler"
            className="inline-flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded text-text-muted transition-colors hover:bg-gray-100 hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-60"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>
    </li>
  );
}

interface CategoryTreeNodeRowProps {
  node: ShopCategoryNode;
  parentId: string | null;
  depth: number;
  expandedIds: Set<string>;
  editingId: string | null;
  editInput: string;
  editError: string | null;
  locked: boolean;
  pendingAddParentId: string | null;
  pendingAddForm: ReactNode;
  activeTooltipId: string | null;
  onActiveTooltipChange: (id: string | null) => void;
  onToggle: (id: string) => void;
  onStartRename: (node: ShopCategoryNode) => void;
  onEditInputChange: (value: string) => void;
  onSubmitRename: (nodeId: string, parentId: string | null) => void;
  onCancelRename: () => void;
  onDelete: (node: ShopCategoryNode) => void;
  onAddChild: (parentId: string, depth: number) => void;
}

function CategoryTreeNodeRow({
  node,
  parentId,
  depth,
  expandedIds,
  editingId,
  editInput,
  editError,
  locked,
  pendingAddParentId,
  pendingAddForm,
  activeTooltipId,
  onActiveTooltipChange,
  onToggle,
  onStartRename,
  onEditInputChange,
  onSubmitRename,
  onCancelRename,
  onDelete,
  onAddChild,
}: CategoryTreeNodeRowProps) {
  const hasChildren = node.children.length > 0;
  const expanded = expandedIds.has(node.id);
  const isEditing = editingId === node.id;
  const canAddChild = depth < SHOP_CATEGORY_MAX_DEPTH;
  const showChildCount = hasChildren && !expanded;

  return (
    <li role="treeitem" aria-expanded={hasChildren ? expanded : undefined} className="list-none">
      <div
        tabIndex={0}
        className="group/row flex h-9 items-center gap-0.5 border-b border-gray-100 outline-none hover:bg-gray-50 focus-within:bg-gray-50 focus-visible:ring-2 focus-visible:ring-purple-100"
      >
        <DepthGuides depth={depth} />

        <div className="inline-flex h-9 w-[18px] shrink-0 items-center justify-center">
          {hasChildren ? (
            <button
              type="button"
              className="inline-flex h-[18px] w-[18px] items-center justify-center rounded text-text-muted hover:bg-gray-100 hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-60"
              aria-label={expanded ? `Replier ${node.name}` : `Déplier ${node.name}`}
              aria-expanded={expanded}
              onClick={() => {
                onToggle(node.id);
              }}
              disabled={locked}
            >
              {expanded ? (
                <ChevronDown className="h-3.5 w-3.5" aria-hidden />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" aria-hidden />
              )}
            </button>
          ) : null}
        </div>

        {isEditing ? (
          <div className="flex min-w-0 flex-1 items-center gap-2 py-1 pr-1">
            <InputField
              id={`rename-${node.id}`}
              label="Renommer"
              labelClassName="sr-only"
              value={editInput}
              onChange={(e) => {
                onEditInputChange(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  onSubmitRename(node.id, parentId);
                }
                if (e.key === 'Escape') onCancelRename();
              }}
              disabled={locked}
              maxLength={SHOP_CATEGORY_NAME_MAX_LENGTH}
              error={editError ?? undefined}
              autoFocus
              containerClassName="min-w-0 flex-1 gap-1"
              inputClassName="h-[30px] rounded-lg py-0"
            />
            <Button
              type="button"
              variant="neutral-outline"
              size="sm"
              disabled={locked}
              onClick={() => {
                onSubmitRename(node.id, parentId);
              }}
              className="h-[30px] !px-3 !py-0 text-sm"
            >
              OK
            </Button>
            <button
              type="button"
              disabled={locked}
              onClick={onCancelRename}
              aria-label="Annuler"
              className="inline-flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded text-text-muted transition-colors hover:bg-gray-100 hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-60"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>
        ) : (
          <>
            <span className="min-w-0 flex-1 truncate text-sm text-text-primary">{node.name}</span>

            {showChildCount ? (
              <span className="shrink-0 pr-1 text-xs text-text-muted tabular-nums">
                {node.children.length}
              </span>
            ) : null}

            <div className="hidden shrink-0 items-center gap-0.5 pr-1 opacity-0 transition-opacity group-hover/row:opacity-100 group-focus-within/row:opacity-100 md:flex">
              {canAddChild ? (
                <RowIconButton
                  tooltipId={`${node.id}-add`}
                  activeTooltipId={activeTooltipId}
                  onActiveTooltipChange={onActiveTooltipChange}
                  label={`Ajouter une sous-catégorie à ${node.name}`}
                  disabled={locked}
                  onClick={() => {
                    onAddChild(node.id, depth);
                  }}
                >
                  <Plus className="h-4 w-4" aria-hidden />
                </RowIconButton>
              ) : null}
              <RowIconButton
                tooltipId={`${node.id}-rename`}
                activeTooltipId={activeTooltipId}
                onActiveTooltipChange={onActiveTooltipChange}
                label={`Renommer ${node.name}`}
                disabled={locked}
                onClick={() => {
                  onStartRename(node);
                }}
              >
                <Pencil className="h-4 w-4" aria-hidden />
              </RowIconButton>
              <RowIconButton
                tooltipId={`${node.id}-delete`}
                activeTooltipId={activeTooltipId}
                onActiveTooltipChange={onActiveTooltipChange}
                label={`Supprimer ${node.name}`}
                disabled={locked}
                onClick={() => {
                  onDelete(node);
                }}
              >
                <Trash2 className="h-4 w-4" aria-hidden />
              </RowIconButton>
            </div>

            <div className="flex shrink-0 pr-1 md:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger
                  disabled={locked}
                  aria-label={`Actions pour ${node.name}`}
                  className="inline-flex h-[26px] w-[26px] items-center justify-center rounded text-text-muted hover:bg-gray-100 hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <MoreHorizontal className="h-4 w-4" aria-hidden />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {canAddChild ? (
                    <DropdownMenuItem
                      disabled={locked}
                      onClick={() => {
                        onAddChild(node.id, depth);
                      }}
                    >
                      Ajouter une sous-catégorie
                    </DropdownMenuItem>
                  ) : null}
                  <DropdownMenuItem
                    disabled={locked}
                    onClick={() => {
                      onStartRename(node);
                    }}
                  >
                    Renommer
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    disabled={locked}
                    onClick={() => {
                      onDelete(node);
                    }}
                  >
                    Supprimer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </>
        )}
      </div>

      {pendingAddParentId === node.id ? pendingAddForm : null}

      {hasChildren && expanded ? (
        <ul className="m-0 list-none p-0" role="group">
          {node.children.map((child) => (
            <CategoryTreeNodeRow
              key={child.id}
              node={child}
              parentId={node.id}
              depth={depth + 1}
              expandedIds={expandedIds}
              editingId={editingId}
              editInput={editInput}
              editError={editError}
              locked={locked}
              pendingAddParentId={pendingAddParentId}
              pendingAddForm={pendingAddForm}
              activeTooltipId={activeTooltipId}
              onActiveTooltipChange={onActiveTooltipChange}
              onToggle={onToggle}
              onStartRename={onStartRename}
              onEditInputChange={onEditInputChange}
              onSubmitRename={onSubmitRename}
              onCancelRename={onCancelRename}
              onDelete={onDelete}
              onAddChild={onAddChild}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

interface DepthGuidesProps {
  depth: number;
}

function DepthGuides({ depth }: DepthGuidesProps) {
  const ancestorCount = Math.max(0, depth - 1);
  if (ancestorCount === 0) return null;
  return (
    <>
      {Array.from({ length: ancestorCount }, (_, index) => (
        <span
          key={index}
          className="h-9 w-5 shrink-0 self-stretch border-l border-gray-200"
          aria-hidden
        />
      ))}
    </>
  );
}

interface RowIconButtonProps {
  tooltipId: string;
  activeTooltipId: string | null;
  onActiveTooltipChange: (id: string | null) => void;
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}

function RowIconButton({
  tooltipId,
  activeTooltipId,
  onActiveTooltipChange,
  label,
  disabled = false,
  onClick,
  children,
}: RowIconButtonProps) {
  const showTooltip = activeTooltipId === tooltipId;

  const clearTooltip = () => {
    onActiveTooltipChange(null);
  };

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        disabled={disabled}
        aria-label={label}
        onClick={onClick}
        onMouseEnter={() => {
          onActiveTooltipChange(tooltipId);
        }}
        onMouseLeave={clearTooltip}
        onFocus={() => {
          onActiveTooltipChange(tooltipId);
        }}
        onBlur={clearTooltip}
        className="inline-flex h-[26px] w-[26px] items-center justify-center rounded text-text-muted transition-colors hover:bg-gray-100 hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-60"
      >
        {children}
      </button>
      {showTooltip ? (
        <span
          role="tooltip"
          className="pointer-events-none absolute left-1/2 top-full z-20 mt-1.5 w-max max-w-[min(14rem,calc(100vw-2rem))] -translate-x-1/2 rounded-md bg-gray-900 px-2 py-1 text-center text-xs leading-snug text-white shadow-md"
        >
          {label}
        </span>
      ) : null}
    </span>
  );
}

function collectIds(nodes: ShopCategoryNode[]): string[] {
  return nodes.flatMap((n) => [n.id, ...collectIds(n.children)]);
}
