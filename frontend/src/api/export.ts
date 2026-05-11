/**
 * Client API — Export CSV
 *
 * Route NestJS :
 *   POST /api/export   (auth requise)
 *
 * Le backend retourne directement un fichier CSV en streaming
 * (`Content-Disposition: attachment`). Pas de JSON intermédiaire.
 * Cette fonction déclenche le téléchargement navigateur automatiquement.
 */

import type { ExportBody } from './types/api.types';
import { getApiBaseUrl } from './apiBase';
import { authHeaders, extractErrorMessage } from './apiAuth';

/**
 * Envoie une requête d'export et déclenche le téléchargement du CSV dans le navigateur.
 *
 * @param body  - Paramètres de l'export (productIds, templateId, format).
 * @param filename - Nom de fichier suggéré (sans extension). Défaut : "export".
 *
 * @throws {Error} 400, 401, ou erreur réseau.
 */
export async function downloadExportCsv(body: ExportBody, filename = 'export'): Promise<void> {
  const res = await fetch(`${getApiBaseUrl()}/api/export`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    // Tenter de lire un corps JSON d'erreur
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

  // Récupérer le blob CSV
  const blob = await res.blob();

  // Extraire le nom de fichier depuis Content-Disposition si disponible
  const cd = res.headers.get('Content-Disposition') ?? '';
  const match = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/i.exec(cd);
  const serverFilename = match?.[1]?.replace(/['"]/g, '').trim();
  const finalFilename =
    serverFilename !== undefined && serverFilename.length > 0 ? serverFilename : `${filename}.csv`;

  // Déclencher le téléchargement navigateur
  triggerDownload(blob, finalFilename);
}

/**
 * Crée un lien temporaire et clique dessus pour déclencher le téléchargement.
 * Compatible avec tous les navigateurs modernes.
 */
function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  // Nettoyage différé pour laisser le temps au téléchargement de démarrer
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}
