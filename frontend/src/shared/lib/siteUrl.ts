/**
 * Indique si l’URL utilise uniquement les schémas `http:` ou `https:`
 * (refuse `javascript:`, `data:`, etc. pour les attributs `href` / `src`).
 */
export function isSafeHttpUrl(raw: string): boolean {
  const trimmed = raw.trim();
  if (!trimmed) return false;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Hostname de site marchand plausible : au moins `domaine.tld`.
 * Refuse les hôtes sans point (`localhost`) et `www.` suivi d’un seul label
 * (`www.glisstestk` — TLD manquant).
 */
export function isPlausibleSiteHostname(hostname: string): boolean {
  const host = hostname.trim().replace(/\.$/, '').toLowerCase();
  if (!host || host.includes('..') || host.includes(':')) return false;

  const labels = host.split('.');
  if (labels.length < 2) return false;
  // www.domaine sans TLD (ex. www.glisstestk)
  if (labels[0] === 'www' && labels.length < 3) return false;

  const tld = labels[labels.length - 1];
  if (!tld || !/^[a-z]{2,24}$/.test(tld)) return false;

  return labels.every((label) => {
    if (!label || label.length > 63) return false;
    return /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(label);
  });
}

function normalizeHttpsUrl(trimmed: string): string | null {
  const u = trimmed.replace(/^https?:\/\//i, 'https://').replace(/\/+$/, '');
  try {
    const parsed = new URL(u);
    if (!isPlausibleSiteHostname(parsed.hostname)) return null;
    return u;
  } catch {
    return null;
  }
}

/**
 * Si la saisie est déjà une URL ou un nom de domaine seul, retourne une URL https normalisée.
 * Sinon retourne `null` (texte libre : recherche Tavily / suggestions heuristiques).
 */
export function parseAsSiteUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  if (/^https?:\/\//i.test(trimmed)) {
    return normalizeHttpsUrl(trimmed);
  }

  if (/^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}$/i.test(trimmed)) {
    return normalizeHttpsUrl(`https://${trimmed}`);
  }

  return null;
}

/**
 * Comme une URL complète avec schéma obligatoire : la saisie doit commencer par `http://` ou `https://`.
 * Un domaine seul (« monsite.fr ») est refusé. Utile pour les formulaires qui exigent une vraie URL.
 */
export function parseAsFullSiteUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  if (!/^https?:\/\//i.test(trimmed)) return null;

  return normalizeHttpsUrl(trimmed);
}
