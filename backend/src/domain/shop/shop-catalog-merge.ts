import { randomUUID } from "node:crypto";

import {
  SHOP_CATEGORY_MAX_DEPTH,
  SHOP_CATEGORY_MAX_NODES,
  type ShopCategoryNode,
} from "./types/shop-category.types";

/**
 * Union de marques existantes + détectées (dédoublonnage insensible à la casse,
 * conserve l’ordre : existantes d’abord, puis nouvelles).
 */
export function mergeShopBrands(existing: string[], detected: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];

  for (const brand of [...existing, ...detected]) {
    const trimmed = brand.trim();
    if (!trimmed) continue;
    const key = trimmed.toLocaleLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
  }

  return out;
}

/**
 * Fusionne deux arbres de catégories par nom (insensible à la casse) à chaque niveau.
 * Conserve les nœuds existants et leurs ids ; ajoute les nœuds détectés absents.
 */
export function mergeShopCategoryTrees(
  existing: ShopCategoryNode[],
  detected: ShopCategoryNode[],
): ShopCategoryNode[] {
  return truncateMergedTree(mergeCategoryLevel(existing, detected));
}

function mergeCategoryLevel(
  existing: ShopCategoryNode[],
  detected: ShopCategoryNode[],
): ShopCategoryNode[] {
  const byName = new Map<string, ShopCategoryNode>();

  for (const node of existing) {
    const key = node.name.trim().toLocaleLowerCase();
    if (!key) continue;
    byName.set(key, {
      id: node.id,
      name: node.name.trim(),
      children: [...node.children],
    });
  }

  for (const node of detected) {
    const key = node.name.trim().toLocaleLowerCase();
    if (!key) continue;
    const current = byName.get(key);
    if (current) {
      current.children = mergeCategoryLevel(current.children, node.children);
    } else {
      byName.set(key, {
        id: randomUUID(),
        name: node.name.trim(),
        children: cloneWithFreshIds(node.children),
      });
    }
  }

  return [...byName.values()];
}

function cloneWithFreshIds(nodes: ShopCategoryNode[]): ShopCategoryNode[] {
  return nodes.map((n) => ({
    id: randomUUID(),
    name: n.name.trim(),
    children: cloneWithFreshIds(n.children),
  }));
}

function truncateMergedTree(
  nodes: ShopCategoryNode[],
  depth = 1,
  budget = { remaining: SHOP_CATEGORY_MAX_NODES },
): ShopCategoryNode[] {
  if (depth > SHOP_CATEGORY_MAX_DEPTH || budget.remaining <= 0) return [];
  const result: ShopCategoryNode[] = [];
  for (const node of nodes) {
    if (budget.remaining <= 0) break;
    budget.remaining -= 1;
    result.push({
      id: node.id,
      name: node.name,
      children: truncateMergedTree(node.children, depth + 1, budget),
    });
  }
  return result;
}
