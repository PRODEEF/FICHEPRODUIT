import { z } from 'zod';

import type { ShopCategoryNode } from '@types-api';

export const SHOP_CATEGORY_NAME_MAX_LENGTH = 64;
export const SHOP_CATEGORY_MAX_DEPTH = 5;
export const SHOP_CATEGORY_MAX_NODES = 100;

export const shopCategoryNameSchema = z
  .string()
  .trim()
  .min(1, 'Ce champ ne peut pas être vide.')
  .max(SHOP_CATEGORY_NAME_MAX_LENGTH, `Maximum ${SHOP_CATEGORY_NAME_MAX_LENGTH} caractères.`);

export function createCategoryNode(name: string): ShopCategoryNode {
  return {
    id: crypto.randomUUID(),
    name: name.trim(),
    children: [],
  };
}

export function countCategoryNodes(nodes: ShopCategoryNode[]): number {
  return nodes.reduce((acc, node) => acc + 1 + countCategoryNodes(node.children), 0);
}

export function categoryNodeDepth(nodes: ShopCategoryNode[], depth = 1): number {
  if (nodes.length === 0) return depth - 1;
  return Math.max(...nodes.map((n) => categoryNodeDepth(n.children, depth + 1)));
}

/** Profondeur du nœud `id` (1 = racine). */
export function findNodeDepth(
  nodes: ShopCategoryNode[],
  id: string,
  depth = 1,
): number | null {
  for (const node of nodes) {
    if (node.id === id) return depth;
    const found = findNodeDepth(node.children, id, depth + 1);
    if (found !== null) return found;
  }
  return null;
}

export function findSiblingDuplicateName(
  siblings: ShopCategoryNode[],
  candidate: string,
  excludeId?: string,
): string | undefined {
  const needle = candidate.trim().toLocaleLowerCase();
  if (!needle) return undefined;
  return siblings.find(
    (n) => n.id !== excludeId && n.name.toLocaleLowerCase() === needle,
  )?.name;
}

export function updateNodeName(
  nodes: ShopCategoryNode[],
  id: string,
  name: string,
): ShopCategoryNode[] {
  return nodes.map((node) => {
    if (node.id === id) {
      return { ...node, name };
    }
    return { ...node, children: updateNodeName(node.children, id, name) };
  });
}

export function removeCategoryNode(nodes: ShopCategoryNode[], id: string): ShopCategoryNode[] {
  return nodes
    .filter((node) => node.id !== id)
    .map((node) => ({
      ...node,
      children: removeCategoryNode(node.children, id),
    }));
}

export function addChildNode(
  nodes: ShopCategoryNode[],
  parentId: string | null,
  child: ShopCategoryNode,
): ShopCategoryNode[] {
  if (parentId === null) {
    return [...nodes, child];
  }
  return nodes.map((node) => {
    if (node.id === parentId) {
      return { ...node, children: [...node.children, child] };
    }
    return { ...node, children: addChildNode(node.children, parentId, child) };
  });
}

export function getSiblings(
  nodes: ShopCategoryNode[],
  parentId: string | null,
): ShopCategoryNode[] {
  if (parentId === null) return nodes;
  return findChildrenOf(nodes, parentId) ?? [];
}

function findChildrenOf(nodes: ShopCategoryNode[], parentId: string): ShopCategoryNode[] | null {
  for (const node of nodes) {
    if (node.id === parentId) return node.children;
    const nested = findChildrenOf(node.children, parentId);
    if (nested !== null) return nested;
  }
  return null;
}

export function categoryDuplicateMessage(existingName: string): string {
  return `« ${existingName} » existe déjà à ce niveau.`;
}
