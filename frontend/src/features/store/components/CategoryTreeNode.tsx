import type { ReactNode } from 'react';
import { ChevronDown, ChevronRight, MoreHorizontal, Pencil, Plus, Trash2, X } from 'lucide-react';

import type { ShopCategoryNode } from '@types-api';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  InputField,
} from '@shared/ui';

import { SHOP_CATEGORY_MAX_DEPTH, SHOP_CATEGORY_NAME_MAX_LENGTH } from '../lib/categoryTreeSchemas';
import { DepthGuides } from './DepthGuides';
import { RowIconButton } from './RowIconButton';

export interface CategoryTreeNodeProps {
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

/**
 * Nœud récursif de l'arbre de catégories.
 * Gère l'affichage du nom, les contrôles de renommage inline et le menu d'actions
 * (ajout sous-catégorie, renommage, suppression) adapté desktop/mobile.
 */
export function CategoryTreeNode({
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
}: CategoryTreeNodeProps) {
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
            <CategoryTreeNode
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
