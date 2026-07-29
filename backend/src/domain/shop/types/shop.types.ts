import type { ShopCategoryNode } from "./shop-category.types";

/** Valeurs alignées sur l'enum PostgreSQL `shop_cms`. */
export type ShopCms = "prestashop" | "shopify" | "woocommerce" | "autre" | "inconnu";

export type Shop = {
  id: string;
  name: string;
  url: string;
  cms: ShopCms;
  sector: string | null;
  brands: string[];
  categoryTree: ShopCategoryNode[];
  ownerId: string | null;
  sessionId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateShop = {
  name: string;
  url: string;
  cms: ShopCms;
  sector: string | null;
  brands: string[];
  categoryTree: ShopCategoryNode[];
  ownerId: string | null;
  sessionId: string | null;
};

export type UpdateShop = Partial<
  Pick<Shop, "name" | "url" | "cms" | "sector" | "brands" | "categoryTree">
>;

/** Upsert depuis le pipeline d’analyse — utilisateur connecté ou invité. */
export type UpsertShopFromAnalysis = {
  name: string;
  url: string;
  cms: ShopCms;
  sector: string | null;
  brands: string[];
  categoryTree: ShopCategoryNode[];
  ownerId: string | null;
  sessionId: string | null;
};

export type { ShopCategoryNode };
