/**
 * Types métier partagés — alignés sur le contrat du backend NestJS.
 *
 * Ces types reflètent exactement les entités renvoyées / attendues par les routes
 * `/api/*`. Ne pas les confondre avec `generated/api.ts` (ancien backend).
 *
 * Règle : tout ce qui vient du réseau passe par ces types. Les composants UI
 * n'importent pas directement depuis `generated/api.ts` pour les entités métier.
 */

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

/** Aligné sur l’enum Postgres `shop_cms` ; `other` / `unknown` restent pour la rétrocompat. */
export type CmsType =
  | 'prestashop'
  | 'shopify'
  | 'woocommerce'
  | 'autre'
  | 'inconnu'
  | 'other'
  | 'unknown';

/** Statuts du cycle de vie d'une analyse. */
export type AnalysisStatus = 'pending' | 'running' | 'done' | 'failed';

/** Codes d'erreur métier retournés quand `status === 'failed'`. */
export type AnalysisErrorCode =
  | 'SITE_UNREACHABLE'
  | 'UNANALYZABLE'
  | 'UNKNOWN_SECTOR'
  | 'INTERNAL_ERROR';

// ---------------------------------------------------------------------------
// User
// ---------------------------------------------------------------------------

export interface User {
  id: string;
  email: string;
  username: string;
  websiteUrl: string | null;
  pendingAutoAnalyze: boolean;
}

// ---------------------------------------------------------------------------
// Analysis
// ---------------------------------------------------------------------------

export interface Analysis {
  id: string;
  url: string;
  status: AnalysisStatus;
  errorCode: AnalysisErrorCode | null;
  errorMessage: string | null;
  userId: string | null;
  sessionId: string | null;
  /** Défini quand status === 'done'. */
  shopId: string | null;
  createdAt: string;
}

export interface CreateAnalysisBody {
  url: string;
}

// ---------------------------------------------------------------------------
// Shop
// ---------------------------------------------------------------------------

export interface Shop {
  id: string;
  name: string;
  url: string;
  cms: CmsType;
  sector: string | null;
  brands: string[];
  categories: string[];
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

/** Corps PATCH `PATCH /api/shop` (tous les champs optionnels). */
export interface PatchMyShopBody {
  name?: string;
  url?: string;
  cms?: CmsType;
  sector?: string | null;
  brands?: string[];
  categories?: string[];
}

// ---------------------------------------------------------------------------
// CatalogProduct
// ---------------------------------------------------------------------------

export interface CatalogProduct {
  id: string;
  name: string;
  brand: string;
  sector: string;
  category: string;
  subCategory: string | null;
  year: number;
  price: number;
  description: string;
  detailedDescription: string;
  images: string[];
  url: string;
  attributes: Record<string, string>;
}

// ---------------------------------------------------------------------------
// ProductTemplate
// ---------------------------------------------------------------------------

export type ProductTemplateFieldType =
  | 'text'
  | 'long_text'
  | 'rich_text'
  | 'number'
  | 'price'
  | 'percentage'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'url'
  | 'email'
  | 'phone'
  | 'enum'
  | 'multi_enum'
  | 'reference'
  | 'image'
  | 'file'
  | 'color'
  | 'size'
  | 'weight'
  | 'dimension'
  | 'country'
  | 'currency'
  | 'json';

export interface ProductTemplateField {
  name: string;
  type: ProductTemplateFieldType;
  required: boolean;
  order: number;
}

export interface ProductTemplate {
  id: string;
  name: string;
  shopId: string;
  fields: ProductTemplateField[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductTemplateBody {
  name: string;
  fields?: ProductTemplateField[];
}

export type UpdateProductTemplateBody = Partial<CreateProductTemplateBody>;

// ---------------------------------------------------------------------------
// Scrape / Refine fields (product templates)
// ---------------------------------------------------------------------------

export interface ScrapeFieldsBody {
  url: string;
}

export interface ScrapeFieldsResponse {
  fields: ProductTemplateField[];
  sampleValues: Record<string, string>;
  warnings: { code: string; message: string }[];
}

export type RefineFieldsSource = 'csv_import' | 'product_page' | 'manual';

export interface RefineFieldsBody {
  source: RefineFieldsSource;
  fields: ProductTemplateField[];
  sampleValues?: Record<string, string>;
}

export interface RefineFieldsResponse {
  fields: ProductTemplateField[];
  refinedWithAi: boolean;
  message?: string;
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

export interface ExportBody {
  /** IDs des produits catalogue à exporter. */
  productIds: string[];
  /** ID du template de fiche produit à appliquer. */
  templateId: string;
  /** Format cible. */
  format: 'prestashop' | 'shopify';
}

// ---------------------------------------------------------------------------
// Suggest URLs
// ---------------------------------------------------------------------------

export interface SuggestUrlsBody {
  q: string;
}

export interface SuggestUrlsResponse {
  urls: string[];
}

// ---------------------------------------------------------------------------
// Guest session claim
// ---------------------------------------------------------------------------

export interface ClaimGuestSessionBody {
  sessionId?: string;
}

export interface ClaimGuestSessionOptions {
  /** Session invité explicite (prioritaire sur sessionStorage). */
  sessionId?: string | null;
  /** JWT fraîchement émis (évite une course avec getSession() juste après signUp). */
  accessToken?: string;
}
