/** Valeurs alignées sur l'enum PostgreSQL `shop_cms`. */
export type ShopCms = "prestashop" | "shopify" | "woocommerce" | "autre" | "inconnu";

export type Shop = {
  id: string;
  name: string;
  url: string;
  cms: ShopCms;
  sector: string | null;
  brands: string[];
  categories: string[];
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
  categories: string[];
  ownerId: string | null;
  sessionId: string | null;
};

export type UpdateShop = Partial<
  Pick<Shop, "name" | "url" | "cms" | "sector" | "brands" | "categories">
>;

/** Upsert depuis le pipeline d’analyse — utilisateur connecté uniquement. */
export type UpsertShopFromAnalysis = {
  name: string;
  url: string;
  cms: ShopCms;
  sector: string | null;
  brands: string[];
  categories: string[];
  ownerId: string | null;
  sessionId: string | null;
};
