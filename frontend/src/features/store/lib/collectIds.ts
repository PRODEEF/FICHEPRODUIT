import type { ShopCategoryNode } from '@types-api';

/**
 * Collecte récursivement tous les identifiants de nœuds d'un arbre de catégories.
 * Utilisé pour initialiser l'ensemble des nœuds dépliés à l'ouverture.
 */
export function collectIds(nodes: ShopCategoryNode[]): string[] {
  return nodes.flatMap((n) => [n.id, ...collectIds(n.children)]);
}
