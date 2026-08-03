/**
 * Client API — Export CSV PrestaShop 8
 *
 * Routes NestJS :
 *   POST /api/export/prestashop/category-preview   (auth requise)
 *   POST /api/export/prestashop                   (auth requise)
 *
 * L’export retourne un fichier CSV en streaming
 * (`Content-Disposition: attachment`). Pas de JSON intermédiaire.
 * Cette fonction déclenche le téléchargement navigateur automatiquement.
 */

import type {
  CategoryExportOverride,
  CategoryExportPreviewParams,
  CategoryExportPreviewResponse,
  PrestashopExportParams,
} from '@types-api';

import { getApiBaseUrl } from './apiBase';
import { authHeaders, extractErrorMessage } from './apiAuth';
import { formatExportClientError } from './exportLimits';
import { getSupabaseSessionAuthHeaders, requestNestJson } from './nestHttpClient';

/**
 * Prévisualise le matching catégories fabricant → arbre magasin.
 */
export async function fetchCategoryExportPreview(
  params: CategoryExportPreviewParams,
): Promise<CategoryExportPreviewResponse> {
  try {
    return await requestNestJson<CategoryExportPreviewResponse>({
      method: 'POST',
      path: '/export/prestashop/category-preview',
      body: {
        shopId: params.shopId,
        productIds: params.productIds,
      },
      authHeaders: getSupabaseSessionAuthHeaders,
    });
  } catch (err) {
    throw new Error(formatExportClientError(err, 'Impossible de prévisualiser les catégories.'), {
      cause: err,
    });
  }
}

/**
 * Télécharge un CSV PrestaShop (`products.csv` ou `combinations.csv`).
 * Utilise `fetch` (et non `requestNestJson`) car la réponse est un blob, pas du JSON.
 *
 * @param params - type, shopId, productIds, categoryOverrides optionnels.
 * @throws {Error} 401 ou autre erreur HTTP / réseau.
 */
export async function downloadPrestashopExportCsv(params: PrestashopExportParams): Promise<void> {
  const body = {
    type: params.type,
    shopId: params.shopId,
    productIds: params.productIds,
    ...(params.categoryOverrides !== undefined && params.categoryOverrides.length > 0
      ? { categoryOverrides: params.categoryOverrides }
      : {}),
  };

  try {
    const res = await fetch(`${getApiBaseUrl()}/api/export/prestashop`, {
      method: 'POST',
      headers: await authHeaders(),
      credentials: 'include',
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      throw await exportHttpError(res);
    }

    const blob = await res.blob();
    const defaultName = params.type === 'products' ? 'products.csv' : 'combinations.csv';
    const filename = filenameFromContentDisposition(
      res.headers.get('Content-Disposition'),
      defaultName,
    );
    triggerDownload(blob, filename);
  } catch (err) {
    throw new Error(formatExportClientError(err, 'Impossible de générer l’export.'), {
      cause: err,
    });
  }
}

export function serializeCategoryOverrides(overrides: CategoryExportOverride[]): string {
  return JSON.stringify(overrides);
}

async function exportHttpError(res: Response): Promise<Error> {
  let parsed: unknown = null;
  const text = await res.text().catch(() => '');
  if (text) {
    try {
      parsed = JSON.parse(text) as unknown;
    } catch {
      // Corps non JSON — on garde le fallback ci-dessous.
    }
  }

  if (res.status === 401) {
    return new Error('Session expirée ou non autorisée. Reconnecte-toi.');
  }

  return new Error(extractErrorMessage(parsed, `Impossible de générer l'export (${res.status}).`));
}

/** Extrait le nom de fichier depuis `Content-Disposition`, sinon `fallback`. */
export function filenameFromContentDisposition(header: string | null, fallback: string): string {
  if (!header) return fallback;
  const match = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/i.exec(header);
  const serverFilename = match?.[1]?.replace(/['"]/g, '').trim();
  return serverFilename && serverFilename.length > 0 ? serverFilename : fallback;
}

/** Crée un lien temporaire et clique dessus pour déclencher le téléchargement. */
function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}
