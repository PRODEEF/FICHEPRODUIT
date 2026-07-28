/**
 * Client API — Export CSV PrestaShop 8
 *
 * Route NestJS :
 *   GET /api/export/prestashop   (auth requise)
 *
 * Le backend retourne un fichier CSV en streaming
 * (`Content-Disposition: attachment`). Pas de JSON intermédiaire.
 * Cette fonction déclenche le téléchargement navigateur automatiquement.
 */

import type { PrestashopExportParams } from './types/api.types';
import { getApiBaseUrl } from './apiBase';
import { authHeadersNoBody, extractErrorMessage } from './apiAuth';

/**
 * Télécharge un CSV PrestaShop (`products.csv` ou `combinations.csv`).
 *
 * @param params - type, shopId, productIds.
 * @throws {Error} 401 ou autre erreur HTTP / réseau.
 */
export async function downloadPrestashopExportCsv(params: PrestashopExportParams): Promise<void> {
  const query = new URLSearchParams({
    type: params.type,
    shopId: params.shopId,
    productIds: params.productIds.join(','),
  });

  const headers = await authHeadersNoBody();

  const res = await fetch(`${getApiBaseUrl()}/api/export/prestashop?${query.toString()}`, {
    method: 'GET',
    headers,
  });

  if (!res.ok) {
    let parsed: unknown = null;
    const text = await res.text().catch(() => '');
    if (text) {
      try {
        parsed = JSON.parse(text);
      } catch {
        /* corps non JSON */
      }
    }

    if (res.status === 401) {
      throw new Error('Session expirée ou non autorisée. Reconnecte-toi.');
    }

    throw new Error(extractErrorMessage(parsed, `Impossible de générer l'export (${res.status}).`));
  }

  const blob = await res.blob();

  const cd = res.headers.get('Content-Disposition') ?? '';
  const match = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/i.exec(cd);
  const serverFilename = match?.[1]?.replace(/['"]/g, '').trim();
  const defaultName = params.type === 'products' ? 'products.csv' : 'combinations.csv';
  const finalFilename =
    serverFilename !== undefined && serverFilename.length > 0 ? serverFilename : defaultName;

  triggerDownload(blob, finalFilename);
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
