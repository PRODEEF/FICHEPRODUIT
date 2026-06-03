/**
 * Client API — Product Templates
 *
 * Routes NestJS :
 *   GET    /api/shops/:shopId/templates              (auth requise)
 *   GET    /api/shops/:shopId/templates/:id          (auth requise)
 *   POST   /api/shops/:shopId/templates              (auth requise)
 *   PATCH  /api/shops/:shopId/templates/:id          (auth requise)
 *   DELETE /api/shops/:shopId/templates/:id          (auth requise)
 *   POST   /api/shops/:shopId/templates/scrape-fields  (auth requise)
 *   POST   /api/shops/:shopId/templates/refine-fields  (auth requise)
 */

import type {
  ProductTemplate,
  ProductTemplateField,
  ProductTemplateFieldType,
  CreateProductTemplateBody,
  UpdateProductTemplateBody,
  ScrapeFieldsBody,
  ScrapeFieldsResponse,
  RefineFieldsBody,
  RefineFieldsResponse,
} from './types/api.types';
import { getApiBaseUrl } from './apiBase';
import { apiFetch, authHeaders, authHeadersNoBody } from './apiAuth';

// ---------------------------------------------------------------------------
// Normalisation
// ---------------------------------------------------------------------------

const VALID_FIELD_TYPES = new Set<string>([
  'text',
  'long_text',
  'rich_text',
  'number',
  'price',
  'percentage',
  'boolean',
  'date',
  'datetime',
  'url',
  'email',
  'phone',
  'enum',
  'multi_enum',
  'reference',
  'image',
  'file',
  'color',
  'size',
  'weight',
  'dimension',
  'country',
  'currency',
  'json',
]);

function normalizeFieldType(raw: unknown): ProductTemplateFieldType {
  if (typeof raw === 'string' && VALID_FIELD_TYPES.has(raw)) {
    return raw as ProductTemplateFieldType;
  }
  return 'text';
}

function normalizeField(raw: unknown): ProductTemplateField | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const o = raw as Record<string, unknown>;
  const name = typeof o['name'] === 'string' ? o['name'] : '';
  if (!name.trim()) return null;
  return {
    name,
    type: normalizeFieldType(o['type']),
    required: o['required'] === true,
    order: typeof o['order'] === 'number' ? o['order'] : 0,
  };
}

function normalizeTemplate(raw: unknown): ProductTemplate | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const o = raw as Record<string, unknown>;

  const id = typeof o['id'] === 'string' ? o['id'] : null;
  const name = typeof o['name'] === 'string' ? o['name'] : null;
  const shopId =
    typeof o['shopId'] === 'string'
      ? o['shopId']
      : typeof o['shop_id'] === 'string'
        ? o['shop_id']
        : null;
  if (!id || !name || !shopId) return null;

  const fields: ProductTemplateField[] = Array.isArray(o['fields'])
    ? (o['fields'] as unknown[]).flatMap((f) => {
        const nf = normalizeField(f);
        return nf ? [nf] : [];
      })
    : [];

  const createdAt =
    typeof o['createdAt'] === 'string'
      ? o['createdAt']
      : typeof o['created_at'] === 'string'
        ? o['created_at']
        : new Date().toISOString();
  const updatedAt =
    typeof o['updatedAt'] === 'string'
      ? o['updatedAt']
      : typeof o['updated_at'] === 'string'
        ? o['updated_at']
        : createdAt;

  return { id, name, shopId, fields, createdAt, updatedAt };
}

function shopTemplatesBase(shopId: string): string {
  return `${getApiBaseUrl()}/api/shops/${encodeURIComponent(shopId)}/templates`;
}

// ---------------------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------------------

/**
 * Liste les templates d'un shop.
 *
 * @throws {Error} 401, 404 ou réseau.
 */
export async function listTemplates(shopId: string): Promise<ProductTemplate[]> {
  const { parsed } = await apiFetch(shopTemplatesBase(shopId), {
    method: 'GET',
    headers: await authHeadersNoBody(),
  });

  if (!Array.isArray(parsed)) {
    throw new Error('Réponse serveur invalide : liste de templates attendue.');
  }

  const out: ProductTemplate[] = [];
  for (const item of parsed) {
    const t = normalizeTemplate(item);
    if (t) out.push(t);
  }
  return out;
}

/**
 * Récupère un template par son ID.
 *
 * @throws {Error} 401, 404 ou réseau.
 */
export async function getTemplate(shopId: string, templateId: string): Promise<ProductTemplate> {
  const { parsed } = await apiFetch(
    `${shopTemplatesBase(shopId)}/${encodeURIComponent(templateId)}`,
    {
      method: 'GET',
      headers: await authHeadersNoBody(),
    },
  );

  const t = normalizeTemplate(parsed);
  if (!t) throw new Error('Réponse serveur invalide : template attendu.');
  return t;
}

/**
 * Crée un nouveau template pour un shop.
 *
 * @throws {Error} 400, 401, 404 ou réseau.
 */
export async function createTemplate(
  shopId: string,
  body: CreateProductTemplateBody,
): Promise<ProductTemplate> {
  const { parsed } = await apiFetch(shopTemplatesBase(shopId), {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify(body),
  });

  const t = normalizeTemplate(parsed);
  if (!t) throw new Error('Réponse serveur invalide : template attendu après création.');
  return t;
}

/**
 * Met à jour un template existant (PATCH partiel).
 *
 * @throws {Error} 400, 401, 404 ou réseau.
 */
export async function updateTemplate(
  shopId: string,
  templateId: string,
  body: UpdateProductTemplateBody,
): Promise<ProductTemplate> {
  const { parsed } = await apiFetch(
    `${shopTemplatesBase(shopId)}/${encodeURIComponent(templateId)}`,
    {
      method: 'PATCH',
      headers: await authHeaders(),
      body: JSON.stringify(body),
    },
  );

  const t = normalizeTemplate(parsed);
  if (!t) throw new Error('Réponse serveur invalide : template attendu après mise à jour.');
  return t;
}

/**
 * Supprime un template.
 *
 * @throws {Error} 401, 404 ou réseau.
 */
export async function deleteTemplate(shopId: string, templateId: string): Promise<void> {
  await apiFetch(`${shopTemplatesBase(shopId)}/${encodeURIComponent(templateId)}`, {
    method: 'DELETE',
    headers: await authHeadersNoBody(),
  });
}

// ---------------------------------------------------------------------------
// Scrape / Refine fields
// ---------------------------------------------------------------------------

/**
 * Détecte les champs depuis une URL de page produit.
 *
 * @throws {Error} 400, 401, 404 ou réseau.
 */
export async function scrapeFields(
  shopId: string,
  body: ScrapeFieldsBody,
): Promise<ScrapeFieldsResponse> {
  const { parsed } = await apiFetch(`${shopTemplatesBase(shopId)}/scrape-fields`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify(body),
  });

  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !Array.isArray((parsed as Record<string, unknown>)['fields'])
  ) {
    throw new Error('Réponse serveur invalide : scrape-fields inattendu.');
  }

  const o = parsed as Record<string, unknown>;
  const fields: ProductTemplateField[] = (o['fields'] as unknown[]).flatMap((f) => {
    const nf = normalizeField(f);
    return nf ? [nf] : [];
  });
  const warnings = Array.isArray(o['warnings'])
    ? (o['warnings'] as Record<string, unknown>[]).map((w) => ({
        code: typeof w['code'] === 'string' ? w['code'] : 'UNKNOWN',
        message: typeof w['message'] === 'string' ? w['message'] : '',
      }))
    : [];

  const sampleValues = normalizeSampleValues(o['sampleValues']);

  return { fields, sampleValues, warnings };
}

function normalizeSampleValues(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== 'object') return {};
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof key === 'string' && typeof value === 'string' && key.trim()) {
      out[key] = value;
    }
  }
  return out;
}

/**
 * Affine les champs avec l'IA.
 *
 * @throws {Error} 400, 401, 404 ou réseau.
 */
export async function refineFields(
  shopId: string,
  body: RefineFieldsBody,
): Promise<RefineFieldsResponse> {
  const { parsed } = await apiFetch(`${shopTemplatesBase(shopId)}/refine-fields`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify(body),
  });

  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !Array.isArray((parsed as Record<string, unknown>)['fields'])
  ) {
    throw new Error('Réponse serveur invalide : refine-fields inattendu.');
  }

  const o = parsed as Record<string, unknown>;
  const fields: ProductTemplateField[] = (o['fields'] as unknown[]).flatMap((f) => {
    const nf = normalizeField(f);
    return nf ? [nf] : [];
  });
  const refinedWithAi = o['refinedWithAi'] === true;
  const message = typeof o['message'] === 'string' ? o['message'] : undefined;

  return message !== undefined
    ? { fields, refinedWithAi, message }
    : { fields, refinedWithAi };
}
