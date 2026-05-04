import type { components } from '../generated/api';

export type SiteAnalysis = components['schemas']['SiteAnalysis'];

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
export function normalizeSiteAnalysisJson(raw: unknown): SiteAnalysis | null {
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
