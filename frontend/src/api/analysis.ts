/**
 * Client API — Analyses
 *
 * Routes NestJS :
 *   POST   /api/analyses          (auth optionnelle)
 *   GET    /api/analyses          (auth requise)
 *   GET    /api/analyses/:id      (auth optionnelle)
 */

import type { Analysis, CreateAnalysisBody } from '@types-api';

import { getApiBaseUrl } from './apiBase';
import {
  apiFetch,
  authHeadersNoBody,
  guestOrAuthHeaders,
  guestOrAuthHeadersNoBodyWithGuestSession,
} from './apiAuth';

// ---------------------------------------------------------------------------
// Normalisation JSON → Analysis
// ---------------------------------------------------------------------------

/**
 * Normalise un objet brut venant du réseau en `Analysis`.
 * Retourne null si la forme est invalide (champ id manquant, etc.).
 */
function normalizeAnalysis(raw: unknown): Analysis | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const o = raw as Record<string, unknown>;

  const id = typeof o['id'] === 'string' ? o['id'] : null;
  const url = typeof o['url'] === 'string' ? o['url'] : null;
  if (!id || !url) return null;

  const status = normalizeStatus(o['status']);
  const errorCode = normalizeErrorCode(o['errorCode'] ?? o['error_code']);
  const errorMessage =
    typeof o['errorMessage'] === 'string'
      ? o['errorMessage']
      : typeof o['error_message'] === 'string'
        ? o['error_message']
        : null;
  const userId =
    typeof o['userId'] === 'string'
      ? o['userId']
      : typeof o['user_id'] === 'string'
        ? o['user_id']
        : null;
  const sessionId =
    typeof o['sessionId'] === 'string'
      ? o['sessionId']
      : typeof o['session_id'] === 'string'
        ? o['session_id']
        : null;
  const shopId =
    typeof o['shopId'] === 'string'
      ? o['shopId']
      : typeof o['shop_id'] === 'string'
        ? o['shop_id']
        : null;
  const createdAt =
    typeof o['createdAt'] === 'string'
      ? o['createdAt']
      : typeof o['created_at'] === 'string'
        ? o['created_at']
        : new Date().toISOString();

  return { id, url, status, errorCode, errorMessage, userId, sessionId, shopId, createdAt };
}

function normalizeStatus(raw: unknown): Analysis['status'] {
  if (raw === 'pending') return 'pending';
  if (raw === 'running' || raw === 'in_progress') return 'running';
  if (raw === 'done' || raw === 'completed') return 'done';
  if (raw === 'failed') return 'failed';
  return 'pending';
}

function normalizeErrorCode(raw: unknown): Analysis['errorCode'] {
  if (raw === 'SITE_UNREACHABLE') return 'SITE_UNREACHABLE';
  if (raw === 'UNANALYZABLE') return 'UNANALYZABLE';
  if (raw === 'UNKNOWN_SECTOR') return 'UNKNOWN_SECTOR';
  if (raw === 'INTERNAL_ERROR') return 'INTERNAL_ERROR';
  return null;
}

// ---------------------------------------------------------------------------
// API calls
// ---------------------------------------------------------------------------

/**
 * Lance une analyse (invitée ou authentifiée).
 *
 * - Sans session Supabase : envoie `x-session-id` → analyse guest.
 * - Avec session          : envoie `Authorization: Bearer …` → analyse rattachée au compte.
 *
 * @throws {Error} réseau, validation, ou corps invalide.
 */
export async function createAnalysis(url: string): Promise<Analysis> {
  const body: CreateAnalysisBody = { url };
  const { parsed } = await apiFetch(`${getApiBaseUrl()}/api/analyses`, {
    method: 'POST',
    headers: await guestOrAuthHeaders(),
    body: JSON.stringify(body),
  });

  const analysis = normalizeAnalysis(parsed);
  if (!analysis) {
    throw new Error("Réponse serveur invalide : impossible de lire l'analyse (JSON inattendu).");
  }
  return analysis;
}

/**
 * Lit l'état courant d'une analyse.
 *
 * @param guestSessionId - Optionnel : session invité si le cookie n’est pas disponible (ex. cross-origin).
 * @throws {Error} 401, 404 ou réseau.
 */
export async function getAnalysis(id: string, guestSessionId?: string | null): Promise<Analysis> {
  const { parsed } = await apiFetch(`${getApiBaseUrl()}/api/analyses/${encodeURIComponent(id)}`, {
    method: 'GET',
    headers: await guestOrAuthHeadersNoBodyWithGuestSession(guestSessionId),
  });

  const analysis = normalizeAnalysis(parsed);
  if (!analysis) {
    throw new Error("Réponse serveur invalide : impossible de lire l'analyse (JSON inattendu).");
  }
  return analysis;
}

/**
 * Liste les analyses de l'utilisateur courant (session requise).
 *
 * @throws {Error} 401 ou réseau.
 */
export async function listAnalyses(): Promise<Analysis[]> {
  const { parsed } = await apiFetch(`${getApiBaseUrl()}/api/analyses`, {
    method: 'GET',
    headers: await authHeadersNoBody(),
  });

  if (!Array.isArray(parsed)) {
    throw new Error("Réponse serveur invalide : liste d'analyses attendue.");
  }

  const out: Analysis[] = [];
  for (const item of parsed) {
    const a = normalizeAnalysis(item);
    if (a) out.push(a);
  }
  return out;
}
