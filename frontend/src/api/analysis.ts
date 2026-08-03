/**
 * Client API — Analyses
 *
 * Routes NestJS :
 *   POST   /api/analyses          (auth optionnelle — cookie invité)
 *   GET    /api/analyses          (auth requise)
 *   GET    /api/analyses/:id      (auth optionnelle — cookie invité)
 */

import type { Analysis, CreateAnalysisBody } from '@types-api';

import { getApiBaseUrl } from './apiBase';
import {
  apiFetch,
  authHeadersNoBody,
  guestOrAuthHeaders,
  guestOrAuthHeadersNoBody,
} from './apiAuth';
import { asRecord, readString } from './parseJsonFields';

// ---------------------------------------------------------------------------
// Normalisation JSON → Analysis
// ---------------------------------------------------------------------------

/**
 * Normalise un objet brut venant du réseau en `Analysis`
 * Retourne null si la forme est invalide (champ id/url manquant).
 */
function normalizeAnalysis(raw: unknown): Analysis | null {
  const o = asRecord(raw);
  if (!o) return null;

  const id = readString(o, 'id');
  const url = readString(o, 'url');
  if (!id || !url) return null;

  return {
    id,
    url,
    status: normalizeStatus(o['status']),
    errorCode: normalizeErrorCode(o['errorCode']),
    errorMessage: readString(o, 'errorMessage'),
    userId: readString(o, 'userId'),
    shopId: readString(o, 'shopId'),
    createdAt: readString(o, 'createdAt') ?? new Date().toISOString(),
  };
}

function normalizeStatus(raw: unknown): Analysis['status'] {
  if (raw === 'pending' || raw === 'running' || raw === 'done' || raw === 'failed') {
    return raw;
  }
  return 'pending';
}

function normalizeErrorCode(raw: unknown): Analysis['errorCode'] {
  if (
    raw === 'SITE_UNREACHABLE' ||
    raw === 'UNANALYZABLE' ||
    raw === 'UNKNOWN_SECTOR' ||
    raw === 'INTERNAL_ERROR'
  ) {
    return raw;
  }
  return null;
}

function requireAnalysis(parsed: unknown): Analysis {
  const analysis = normalizeAnalysis(parsed);
  if (!analysis) {
    throw new Error("Réponse serveur invalide : impossible de lire l'analyse (JSON inattendu).");
  }
  return analysis;
}

// ---------------------------------------------------------------------------
// API calls
// ---------------------------------------------------------------------------

/**
 * Lance une analyse (invitée ou authentifiée).
 *
 * - Sans session Supabase : cookie `ficheproduct_guest_session` géré côté navigateur.
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
  return requireAnalysis(parsed);
}

/**
 * Lit l'état courant d'une analyse.
 * L'authentification invitée est assurée par le cookie httpOnly `ficheproduct_guest_session`.
 *
 * @throws {Error} 401, 404 ou réseau.
 */
export async function getAnalysis(id: string): Promise<Analysis> {
  const { parsed } = await apiFetch(`${getApiBaseUrl()}/api/analyses/${encodeURIComponent(id)}`, {
    method: 'GET',
    headers: await guestOrAuthHeadersNoBody(),
  });
  return requireAnalysis(parsed);
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
    const analysis = normalizeAnalysis(item);
    if (analysis) out.push(analysis);
  }
  return out;
}
