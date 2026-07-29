import { z } from "zod";

import {
  SHOP_CATEGORY_MAX_DEPTH,
  SHOP_CATEGORY_MAX_NODES,
  SHOP_CATEGORY_NAME_MAX_LENGTH,
  type ShopCategoryNode,
} from "../types/shop-category.types";

function countNodes(nodes: ShopCategoryNode[]): number {
  return nodes.reduce((acc, node) => acc + 1 + countNodes(node.children), 0);
}

function maxDepth(nodes: ShopCategoryNode[], depth = 1): number {
  if (nodes.length === 0) return depth - 1;
  return Math.max(...nodes.map((n) => maxDepth(n.children, depth + 1)));
}

export const shopCategoryNodeSchema: z.ZodType<ShopCategoryNode> = z.lazy(() =>
  z.object({
    id: z.uuid(),
    name: z.string().trim().min(1).max(SHOP_CATEGORY_NAME_MAX_LENGTH),
    children: z.array(shopCategoryNodeSchema),
  }),
);

export const shopCategoryTreeSchema = z.array(shopCategoryNodeSchema).superRefine((tree, ctx) => {
  if (countNodes(tree) > SHOP_CATEGORY_MAX_NODES) {
    ctx.addIssue({
      code: "custom",
      message: `Maximum ${SHOP_CATEGORY_MAX_NODES} catégories autorisées.`,
    });
  }
  if (maxDepth(tree) > SHOP_CATEGORY_MAX_DEPTH) {
    ctx.addIssue({
      code: "custom",
      message: `Profondeur maximale ${SHOP_CATEGORY_MAX_DEPTH} niveaux.`,
    });
  }
});

/**
 * Normalise une valeur JSONB brute en arbre de catégories.
 * Ignore les nœuds invalides plutôt que de faire échouer toute la lecture.
 */
export function parseCategoryTree(raw: unknown): ShopCategoryNode[] {
  const parsed = shopCategoryTreeSchema.safeParse(raw);
  if (parsed.success) return parsed.data;
  if (!Array.isArray(raw)) return [];

  const normalizeNode = (value: unknown): ShopCategoryNode | null => {
    if (typeof value !== "object" || value === null) return null;
    const o = value as Record<string, unknown>;
    const id = typeof o["id"] === "string" ? o["id"].trim() : "";
    const name = typeof o["name"] === "string" ? o["name"].trim() : "";
    if (!id || !name) return null;
    const childrenRaw = Array.isArray(o["children"]) ? o["children"] : [];
    const children = childrenRaw
      .map(normalizeNode)
      .filter((n): n is ShopCategoryNode => n !== null);
    return { id, name: name.slice(0, SHOP_CATEGORY_NAME_MAX_LENGTH), children };
  };

  return raw.map(normalizeNode).filter((n): n is ShopCategoryNode => n !== null);
}
