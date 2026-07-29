/** Nœud d’arborescence des catégories magasin (menu du site). */
export type ShopCategoryNode = {
  id: string;
  name: string;
  children: ShopCategoryNode[];
};

export const SHOP_CATEGORY_NAME_MAX_LENGTH = 64;
export const SHOP_CATEGORY_MAX_DEPTH = 5;
export const SHOP_CATEGORY_MAX_NODES = 100;
