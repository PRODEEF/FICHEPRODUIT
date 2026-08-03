/** Message générique quand le site ne répond pas ou est introuvable. */
export const ANALYSIS_SITE_UNREACHABLE_MESSAGE = "Le site est inaccessible ou introuvable.";

/** Message quand le nom de domaine ne résout pas (URL inexistante / faute de frappe). */
export const ANALYSIS_DNS_NOT_FOUND_MESSAGE =
  "Impossible de joindre ce site : l’adresse n’existe pas ou est incorrecte.";

/** Message quand le site met trop de temps à répondre. */
export const ANALYSIS_SITE_TIMEOUT_MESSAGE =
  "Le site met trop de temps à répondre. Réessayez plus tard.";

/** Message quand la connexion TCP est refusée / coupée. */
export const ANALYSIS_SITE_CONNECTION_MESSAGE = "Impossible de se connecter au site.";

/** Message pour une URL mal formée ou un protocole non supporté. */
export const ANALYSIS_URL_INVALID_MESSAGE = "L’URL du site est invalide.";

/**
 * Convertit une erreur technique de scrape (DNS, timeout, HTTP…) en message utilisateur.
 * Les détails système (getaddrinfo, ENOTFOUND, etc.) ne doivent jamais remonter à l’UI.
 */
export function toUserFacingSiteUnreachableMessage(rawError: string): string {
  const raw = rawError.trim();
  if (!raw) return ANALYSIS_SITE_UNREACHABLE_MESSAGE;

  const lower = raw.toLowerCase();

  if (
    lower.includes("enotfound") ||
    lower.includes("eai_again") ||
    lower.startsWith("dns:") ||
    lower.includes("getaddrinfo") ||
    lower.includes("résolution dns vide")
  ) {
    return ANALYSIS_DNS_NOT_FOUND_MESSAGE;
  }

  if (
    lower.includes("timeout") ||
    lower.includes("etimedout") ||
    lower.includes("aborted") ||
    lower.includes("abort")
  ) {
    return ANALYSIS_SITE_TIMEOUT_MESSAGE;
  }

  if (
    lower.includes("econnrefused") ||
    lower.includes("econnreset") ||
    lower.includes("fetch failed")
  ) {
    return ANALYSIS_SITE_CONNECTION_MESSAGE;
  }

  if (
    raw === "URL invalide" ||
    raw === "Hôte manquant" ||
    raw.startsWith("Protocole non autorisé") ||
    raw.startsWith("Identifiants dans")
  ) {
    return ANALYSIS_URL_INVALID_MESSAGE;
  }

  if (/^HTTP \d{3}/i.test(raw)) {
    return "Le site a renvoyé une erreur et n’a pas pu être analysé.";
  }

  if (
    raw === "Hôte non autorisé" ||
    raw === "Adresse IP non autorisée" ||
    raw.startsWith("La résolution DNS pointe")
  ) {
    return ANALYSIS_SITE_UNREACHABLE_MESSAGE;
  }

  // Erreurs système Node / codes syscall — ne jamais les afficher tels quels
  if (/\b(E[A-Z0-9]{3,})\b/.test(raw) || /^[A-Z]{2,}:\s/.test(raw)) {
    return ANALYSIS_SITE_UNREACHABLE_MESSAGE;
  }

  // Message déjà lisible (court, sans jargon technique)
  if (raw.length <= 120 && !/[a-z]+Error\b/i.test(raw) && !lower.includes("syscall")) {
    return raw;
  }

  return ANALYSIS_SITE_UNREACHABLE_MESSAGE;
}
