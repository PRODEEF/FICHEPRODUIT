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

const INSUFFICIENT_CREDITS_CODE = 'INSUFFICIENT_CREDITS' as const;

export interface ExportInsufficientCreditsDetails {
  required?: number;
  available?: number;
}

/** Levée lorsque l'export est refusé faute de crédits (HTTP 402). */
export class ExportInsufficientCreditsError extends Error {
  readonly status = 402;
  readonly code = INSUFFICIENT_CREDITS_CODE;
  /** Présent uniquement si fourni — `declare` évite d'initialiser à `undefined` (exactOptionalPropertyTypes). */
  declare readonly requiredCredits?: number;
  declare readonly availableCredits?: number;

  constructor(message: string, details?: ExportInsufficientCreditsDetails) {
    super(message);
    this.name = 'ExportInsufficientCreditsError';
    if (details?.required !== undefined) {
      this.requiredCredits = details.required;
    }
    if (details?.available !== undefined) {
      this.availableCredits = details.available;
    }
  }
}

type InsufficientCreditsParseResult =
  | { isInsufficient: false }
  | ({ isInsufficient: true } & ExportInsufficientCreditsDetails);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readNonNegativeInt(value: unknown): number | undefined {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    return undefined;
  }
  return Math.trunc(value);
}

/**
 * Détecte une réponse 402 crédits insuffisants (format NestJS + champs métier optionnels).
 * Exporté pour les tests unitaires.
 */
export function parseInsufficientCreditsBody(parsed: unknown): InsufficientCreditsParseResult {
  if (!isRecord(parsed)) {
    return { isInsufficient: false };
  }

  const errorCode = parsed['error'];
  const message = parsed['message'];
  const isInsufficient =
    errorCode === INSUFFICIENT_CREDITS_CODE ||
    (typeof message === 'string' && message.includes(INSUFFICIENT_CREDITS_CODE));

  if (!isInsufficient) {
    return { isInsufficient: false };
  }

  const result: { isInsufficient: true } & ExportInsufficientCreditsDetails = {
    isInsufficient: true,
  };

  const required = readNonNegativeInt(parsed['required']);
  const available = readNonNegativeInt(parsed['available']);
  if (required !== undefined) {
    result.required = required;
  }
  if (available !== undefined) {
    result.available = available;
  }

  return result;
}

function formatInsufficientCreditsMessage(parsed: unknown): string {
  const raw = extractErrorMessage(parsed, 'Crédits insuffisants pour cet export.');
  return raw.replace(new RegExp(`^${INSUFFICIENT_CREDITS_CODE}:\\s*`), '');
}

function buildInsufficientCreditsDetails(
  parsed: InsufficientCreditsParseResult & { isInsufficient: true },
): ExportInsufficientCreditsDetails | undefined {
  const details: ExportInsufficientCreditsDetails = {};
  if (parsed.required !== undefined) {
    details.required = parsed.required;
  }
  if (parsed.available !== undefined) {
    details.available = parsed.available;
  }
  return details.required !== undefined || details.available !== undefined ? details : undefined;
}

/**
 * Envoie une requête d'export et déclenche le téléchargement du CSV dans le navigateur.
 *
 * @param body  - Paramètres de l'export (productIds, shopId).
 * @param filename - Nom de fichier suggéré (sans extension). Défaut : "export".
 *
 * @throws {ExportInsufficientCreditsError} HTTP 402 — crédits insuffisants.
 * @throws {Error} 401 ou autre erreur HTTP / réseau.
 */
export async function downloadExportCsv(body: ExportBody, filename = 'export'): Promise<void> {
  const res = await fetch(`${getApiBaseUrl()}/api/export`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify(body),
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

    if (res.status === 402) {
      const insufficient = parseInsufficientCreditsBody(parsed);
      if (insufficient.isInsufficient) {
        throw new ExportInsufficientCreditsError(
          formatInsufficientCreditsMessage(parsed),
          buildInsufficientCreditsDetails(insufficient),
        );
      }
    }

    throw new Error(extractErrorMessage(parsed, `Impossible de générer l'export (${res.status}).`));
  }

  const blob = await res.blob();

  const cd = res.headers.get('Content-Disposition') ?? '';
  const match = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/i.exec(cd);
  const serverFilename = match?.[1]?.replace(/['"]/g, '').trim();
  const finalFilename =
    serverFilename !== undefined && serverFilename.length > 0 ? serverFilename : `${filename}.csv`;

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
