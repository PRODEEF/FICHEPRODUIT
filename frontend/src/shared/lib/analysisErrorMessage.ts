import type { AnalysisErrorCode } from '@types-api';

/** Message générique quand le site ne répond pas ou est introuvable. */
export const ANALYSIS_SITE_UNREACHABLE_MESSAGE = 'Le site est inaccessible ou introuvable.';

/** Message quand le nom de domaine ne résout pas (URL inexistante / faute de frappe). */
export const ANALYSIS_DNS_NOT_FOUND_MESSAGE =
  'Impossible de joindre ce site : l’adresse n’existe pas ou est incorrecte.';

/** Message quand le site met trop de temps à répondre. */
export const ANALYSIS_SITE_TIMEOUT_MESSAGE =
  'Le site met trop de temps à répondre. Réessayez plus tard.';

/** Message quand la connexion est refusée / coupée. */
export const ANALYSIS_SITE_CONNECTION_MESSAGE = 'Impossible de se connecter au site.';

/** Message pour une URL malformée. */
export const ANALYSIS_URL_INVALID_MESSAGE = 'L’URL du site est invalide.';

/**
 * Convertit une erreur d’analyse (code + message technique éventuel) en texte affiché à l’utilisateur.
 */
export function toUserFacingAnalysisError(
  errorCode: AnalysisErrorCode | null | undefined,
  errorMessage: string | null | undefined,
): string {
  const raw = typeof errorMessage === 'string' ? errorMessage.trim() : '';

  if (raw) {
    return sanitizeTechnicalAnalysisError(raw);
  }

  return errorCodeToMessage(errorCode);
}

function errorCodeToMessage(code: AnalysisErrorCode | null | undefined): string {
  switch (code) {
    case 'SITE_UNREACHABLE':
      return ANALYSIS_SITE_UNREACHABLE_MESSAGE;
    case 'UNANALYZABLE':
      return "Le site n'a pas pu être analysé (structure non reconnue).";
    case 'INTERNAL_ERROR':
    default:
      return 'Analyse terminée avec erreur inconnue.';
  }
}

function sanitizeTechnicalAnalysisError(raw: string): string {
  const lower = raw.toLowerCase();

  if (
    lower.includes('enotfound') ||
    lower.includes('eai_again') ||
    lower.startsWith('dns:') ||
    lower.includes('getaddrinfo') ||
    lower.includes('résolution dns vide')
  ) {
    return ANALYSIS_DNS_NOT_FOUND_MESSAGE;
  }

  if (
    lower.includes('timeout') ||
    lower.includes('etimedout') ||
    lower.includes('aborted') ||
    lower.includes('abort')
  ) {
    return ANALYSIS_SITE_TIMEOUT_MESSAGE;
  }

  if (
    lower.includes('econnrefused') ||
    lower.includes('econnreset') ||
    lower.includes('fetch failed')
  ) {
    return ANALYSIS_SITE_CONNECTION_MESSAGE;
  }

  if (
    raw === 'URL invalide' ||
    raw === 'Hôte manquant' ||
    raw.startsWith('Protocole non autorisé') ||
    raw.startsWith('Identifiants dans')
  ) {
    return ANALYSIS_URL_INVALID_MESSAGE;
  }

  if (/^HTTP \d{3}/i.test(raw)) {
    return 'Le site a renvoyé une erreur et n’a pas pu être analysé.';
  }

  if (/\b(E[A-Z0-9]{3,})\b/.test(raw) || /^[A-Z]{2,}:\s/.test(raw) || lower.includes('syscall')) {
    return ANALYSIS_SITE_UNREACHABLE_MESSAGE;
  }

  return raw;
}
