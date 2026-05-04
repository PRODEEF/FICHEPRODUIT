import type { ProductTemplateRow } from './productTemplateTypes';

/** Cache mémoire non persisté : listes de gabarits produit par identifiant utilisateur. */

const listByUserId = new Map<string, ProductTemplateRow[]>();

export function getCachedProductTemplatesList(userId: string): ProductTemplateRow[] | undefined {
  return listByUserId.get(userId);
}

export function setCachedProductTemplatesList(userId: string, rows: ProductTemplateRow[]): void {
  listByUserId.set(userId, rows);
}
