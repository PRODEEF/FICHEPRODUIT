import type { components } from '../../../generated/api';

import { getApiBaseUrl } from '../api/apiBase';
import { getSupabaseClient } from '../api/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

export type SiteAnalysis = components['schemas']['SiteAnalysis'];
export type Product = components['schemas']['Product'];
export type ProductListResponse = components['schemas']['ProductListResponse'];

export type AnalysisProductsQuery = {
  search?: string;
  brand?: string;
  year?: string;
  category?: string;
  subCategory?: string;
};

// ─── SiteAnalysis normalisation (absorbe siteAnalysisPayload.ts) ──────────────

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CMS_VALUES = ['woocommerce', 'shopify', 'prestashop', 'unknown'] as const;
const STATUS_VALUES = ['pending', 'in_progress', 'completed', 'failed'] as const;

function pickStr(obj: Record<string, unknown>, keys: string[]): string | undefined {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === 'string' && v.length > 0) return v;
  }
  return undefined;
}

function pickNum(obj: Record<string, unknown>, keys: string[]): number | undefined {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === 'number' && !Number.isNaN(v)) return v;
    if (typeof v === 'string' && v.trim()) {
      const n = Number(v);
      if (!Number.isNaN(n)) return n;
    }
  }
  return undefined;
}

function pickUuid(obj: Record<string, unknown>, keys: string[]): string | undefined {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === 'string') {
      const t = v.replace(/^urn:uuid:/i, '').trim();
      if (UUID_RE.test(t)) return t;
    }
  }
  return undefined;
}

function pickStrArray(obj: Record<string, unknown>, keys: string[]): string[] | undefined {
  for (const k of keys) {
    const v = obj[k];
    if (Array.isArray(v) && v.every((x) => typeof x === 'string')) {
      return v as string[];
    }
  }
  return undefined;
}

function unwrapPayload(raw: unknown): Record<string, unknown> | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === 'string') {
    try {
      return unwrapPayload(JSON.parse(raw));
    } catch {
      return null;
    }
  }
  if (typeof raw !== 'object' || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  if ('data' in o && o.data !== null && typeof o.data === 'object' && !Array.isArray(o.data)) {
    return o.data as Record<string, unknown>;
  }
  return o;
}

function pickCms(obj: Record<string, unknown>): SiteAnalysis['cmsType'] | undefined {
  const raw = pickStr(obj, ['cmsType', 'cms_type']);
  if (raw && (CMS_VALUES as readonly string[]).includes(raw)) {
    return raw as SiteAnalysis['cmsType'];
  }
  return undefined;
}

function pickStatus(obj: Record<string, unknown>): SiteAnalysis['status'] {
  const raw = pickStr(obj, ['status', 'Status']);
  if (raw && (STATUS_VALUES as readonly string[]).includes(raw)) {
    return raw as SiteAnalysis['status'];
  }
  return 'pending';
}

/**
 * Harmonise les formes JSON renvoyées par le serveur (camelCase, snake_case, enveloppe `{ data: … }`)
 * vers le type `SiteAnalysis`.
 */
function normalizeSiteAnalysisJson(raw: unknown): SiteAnalysis | null {
  const obj = unwrapPayload(raw);
  if (!obj) return null;

  const id = pickUuid(obj, ['id', 'Id', 'analysis_id']);
  const userId =
    pickUuid(obj, ['userId', 'user_id', 'UserId']) ?? '00000000-0000-0000-0000-000000000000';
  const url = pickStr(obj, ['url', 'Url']);
  if (!id || !url) return null;

  const createdAt = pickStr(obj, ['createdAt', 'created_at']) ?? new Date().toISOString();
  const updatedAt = pickStr(obj, ['updatedAt', 'updated_at']) ?? new Date().toISOString();

  let catalogMatchCategories = pickStrArray(obj, [
    'catalogMatchCategories',
    'catalog_match_categories',
  ]);
  if (!catalogMatchCategories || catalogMatchCategories.length === 0) {
    catalogMatchCategories = undefined;
  }

  return {
    id,
    userId,
    url,
    cmsType: pickCms(obj),
    status: pickStatus(obj),
    currentStep: pickNum(obj, ['currentStep', 'current_step']) ?? 0,
    errorMessage: pickStr(obj, ['errorMessage', 'error_message']),
    productCount: pickNum(obj, ['productCount', 'product_count']) ?? 0,
    brandsList: pickStrArray(obj, ['brandsList', 'brands_list']),
    verticalSummary: pickStr(obj, ['verticalSummary', 'vertical_summary']),
    catalogMatchCategories:
      catalogMatchCategories && catalogMatchCategories.length > 0
        ? catalogMatchCategories
        : undefined,
    createdAt,
    updatedAt,
  };
}

// ─── ProductListResponse normalisation ───────────────────────────────────────

function normalizeProductListJson(raw: unknown): ProductListResponse {
  const obj =
    raw !== null && typeof raw === 'object' && !Array.isArray(raw)
      ? (raw as Record<string, unknown>)
      : null;

  const productsRaw = obj?.products;
  const products: Product[] = [];
  if (Array.isArray(productsRaw)) {
    for (const p of productsRaw) {
      if (!p || typeof p !== 'object' || Array.isArray(p)) continue;
      const o = p as Record<string, unknown>;
      const id = typeof o.id === 'string' ? o.id : '';
      const siteAnalysisId =
        typeof o.siteAnalysisId === 'string'
          ? o.siteAnalysisId
          : typeof o.site_analysis_id === 'string'
            ? o.site_analysis_id
            : '';
      const title = typeof o.title === 'string' ? o.title : '';
      const createdAt =
        typeof o.createdAt === 'string'
          ? o.createdAt
          : typeof o.created_at === 'string'
            ? o.created_at
            : new Date().toISOString();
      if (!id || !title) continue;
      products.push({
        id,
        siteAnalysisId,
        title,
        brand: typeof o.brand === 'string' ? o.brand : undefined,
        year: typeof o.year === 'string' ? o.year : undefined,
        category: typeof o.category === 'string' ? o.category : undefined,
        subCategory:
          typeof o.subCategory === 'string'
            ? o.subCategory
            : typeof o.sub_category === 'string'
              ? o.sub_category
              : undefined,
        description: typeof o.description === 'string' ? o.description : undefined,
        commercialDescription:
          typeof o.commercialDescription === 'string'
            ? o.commercialDescription
            : typeof o.commercial_description === 'string'
              ? o.commercial_description
              : undefined,
        price: typeof o.price === 'number' ? o.price : undefined,
        currency: typeof o.currency === 'string' && o.currency ? o.currency : 'EUR',
        imageUrl:
          typeof o.imageUrl === 'string'
            ? o.imageUrl
            : typeof o.image_url === 'string'
              ? o.image_url
              : undefined,
        sourceUrl:
          typeof o.sourceUrl === 'string'
            ? o.sourceUrl
            : typeof o.source_url === 'string'
              ? o.source_url
              : undefined,
        createdAt,
      });
    }
  }

  const strArray = (camel: string, snake: string): string[] => {
    if (!obj) return [];
    const v = obj[camel] ?? obj[snake];
    return Array.isArray(v) && v.every((x) => typeof x === 'string') ? (v as string[]) : [];
  };

  const total =
    typeof obj?.total === 'number' && !Number.isNaN(obj.total) ? obj.total : products.length;

  return {
    products,
    total,
    brands: strArray('brands', 'brands'),
    categories: strArray('categories', 'categories'),
    subCategories: strArray('subCategories', 'sub_categories'),
    years: strArray('years', 'years'),
  };
}

// ─── HTTP helpers ─────────────────────────────────────────────────────────────

async function analysesAuthHeaders(): Promise<Record<string, string>> {
  const supabase = getSupabaseClient();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (supabase) {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.access_token) {
      headers.Authorization = `Bearer ${session.access_token}`;
    }
  }
  return headers;
}

function errorMessageFromBody(parsed: unknown, fallback: string): string {
  if (
    typeof parsed === 'object' &&
    parsed !== null &&
    'message' in parsed &&
    typeof (parsed as { message: unknown }).message === 'string'
  ) {
    const m = (parsed as { message: string }).message.trim();
    if (m) return m;
  }
  return fallback;
}

// ─── API functions ────────────────────────────────────────────────────────────

export async function postSiteAnalysis(url: string): Promise<SiteAnalysis> {
  const res = await fetch(`${getApiBaseUrl()}/analyses`, {
    method: 'POST',
    headers: await analysesAuthHeaders(),
    body: JSON.stringify({ url }),
  });
  const text = await res.text();
  let parsed: unknown;
  try {
    parsed = text.length > 0 ? JSON.parse(text) : null;
  } catch {
    throw new Error('Réponse du serveur non JSON.');
  }
  if (!res.ok) {
    if (res.status === 401) throw new Error('Session expirée ou non autorisée. Reconnecte-toi.');
    throw new Error(errorMessageFromBody(parsed, `Impossible de créer l'analyse (${res.status}).`));
  }
  const normalized = normalizeSiteAnalysisJson(parsed);
  if (!normalized) {
    throw new Error(
      'Réponse serveur invalide : impossible de lire l’analyse (JSON inattendu). Vérifie que le backend renvoie bien un SiteAnalysis.',
    );
  }
  return normalized;
}

export async function getSiteAnalysis(id: string): Promise<SiteAnalysis> {
  const res = await fetch(`${getApiBaseUrl()}/analyses/${encodeURIComponent(id)}`, {
    method: 'GET',
    headers: await analysesAuthHeaders(),
  });
  const text = await res.text();
  let parsed: unknown;
  try {
    parsed = text.length > 0 ? JSON.parse(text) : null;
  } catch {
    throw new Error('Réponse du serveur non JSON.');
  }
  if (!res.ok) {
    if (res.status === 401) throw new Error('Session expirée ou non autorisée. Reconnecte-toi.');
    if (res.status === 404) throw new Error('Analyse introuvable.');
    throw new Error(errorMessageFromBody(parsed, `Erreur lors de la lecture de l'analyse (${res.status}).`));
  }
  const normalized = normalizeSiteAnalysisJson(parsed);
  if (!normalized) {
    throw new Error('Réponse serveur invalide : impossible de lire l’analyse (JSON inattendu).');
  }
  return normalized;
}

export async function listSiteAnalyses(): Promise<SiteAnalysis[]> {
  const res = await fetch(`${getApiBaseUrl()}/analyses`, {
    method: 'GET',
    headers: await analysesAuthHeaders(),
  });
  const text = await res.text();
  let parsed: unknown;
  try {
    parsed = text.length > 0 ? JSON.parse(text) : null;
  } catch {
    throw new Error('Réponse du serveur non JSON.');
  }
  if (!res.ok) {
    if (res.status === 401) throw new Error('Session expirée ou non autorisée. Reconnecte-toi.');
    throw new Error(errorMessageFromBody(parsed, `Impossible de lister les analyses (${res.status}).`));
  }
  if (!Array.isArray(parsed)) {
    throw new Error('Réponse serveur invalide : liste d’analyses attendue.');
  }
  const out: SiteAnalysis[] = [];
  for (const item of parsed) {
    const normalized = normalizeSiteAnalysisJson(item);
    if (normalized) out.push(normalized);
  }
  return out;
}

export async function getAnalysisProducts(
  analysisId: string,
  query?: AnalysisProductsQuery,
): Promise<ProductListResponse> {
  const params = new URLSearchParams();
  const q = query ?? {};
  if (q.search?.trim()) params.set('search', q.search.trim());
  if (q.brand?.trim()) params.set('brand', q.brand.trim());
  if (q.year?.trim()) params.set('year', q.year.trim());
  if (q.category?.trim()) params.set('category', q.category.trim());
  if (q.subCategory?.trim()) params.set('subCategory', q.subCategory.trim());
  const qs = params.toString();
  const url = `${getApiBaseUrl()}/analyses/${encodeURIComponent(analysisId)}/products${qs ? `?${qs}` : ''}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: await analysesAuthHeaders(),
  });
  const text = await res.text();
  let parsed: unknown;
  try {
    parsed = text.length > 0 ? JSON.parse(text) : null;
  } catch {
    throw new Error('Réponse du serveur non JSON.');
  }
  if (!res.ok) {
    if (res.status === 401) throw new Error('Session expirée ou non autorisée. Reconnecte-toi.');
    if (res.status === 404) throw new Error('Analyse introuvable.');
    throw new Error(errorMessageFromBody(parsed, `Impossible de charger les produits (${res.status}).`));
  }
  return normalizeProductListJson(parsed);
}
