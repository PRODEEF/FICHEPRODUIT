import { isAbortError, isApiError, isNetworkError } from '@api/apiError';

/**
 * Messages UI français pour les erreurs du client API.
 * La couche réseau (`ApiError`) ne porte que le message serveur brut.
 */

function defaultMessageForStatus(status: number): string {
  switch (status) {
    case 400:
      return 'Requête invalide.';
    case 401:
      return 'Session expirée ou non autorisée. Reconnecte-toi.';
    case 403:
      return 'Accès refusé.';
    case 404:
      return 'Ressource introuvable.';
    case 409:
      return 'Conflit avec l’état actuel de la ressource.';
    case 422:
      return 'Données invalides.';
    case 429:
      return 'Trop de requêtes. Réessaie dans un instant.';
    case 500:
      return 'Erreur interne du serveur.';
    case 502:
      return 'Passerelle invalide.';
    case 503:
      return 'Service temporairement indisponible.';
    default:
      if (status >= 500) return `Erreur serveur (${status}).`;
      if (status >= 400) return `Erreur client (${status}).`;
      return `Erreur HTTP (${status}).`;
  }
}

const NETWORK_UI_MESSAGE = 'Impossible de contacter le serveur. Vérifie ta connexion et réessaie.';

/**
 * Message court pour l’interface à partir d’une erreur API / réseau.
 * - 4xx : fait confiance au message serveur s’il est présent
 * - 5xx : toujours le fallback générique (le brut est déjà logué côté client)
 * - réseau : message de connectivité
 * - AbortError : chaîne vide (ne pas afficher)
 */
export function apiErrorMessage(error: unknown, fallback = 'Une erreur est survenue.'): string {
  if (isAbortError(error)) return '';

  if (isNetworkError(error)) return NETWORK_UI_MESSAGE;

  if (isApiError(error)) {
    if (error.status >= 500) return defaultMessageForStatus(error.status);

    const serverMessage = error.message.trim();
    if (serverMessage.length > 0) return serverMessage;

    return defaultMessageForStatus(error.status);
  }

  if (error instanceof Error) {
    const msg = error.message.trim();
    if (msg.length > 0) return msg;
  }

  return fallback;
}
