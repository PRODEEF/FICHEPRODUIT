/**
 * Plafond d’export PrestaShop par fichier — aligné sur le backend
 * (`PRESTASHOP_EXPORT_MAX_PRODUCTS`) et le chargement catalogue par marques (1000).
 */
export const PRESTASHOP_EXPORT_MAX_PRODUCTS = 1000;

/**
 * Transforme les erreurs réseau navigateur (`Failed to fetch`) en message utilisateur.
 */
export function formatExportClientError(err: unknown, fallback: string): string {
  if (err instanceof Error) {
    const msg = err.message.trim();
    if (msg === 'Failed to fetch' || msg === 'NetworkError when attempting to fetch resource.') {
      return 'Impossible de contacter le serveur. Vérifie ta connexion et réessaie.';
    }
    if (msg.length > 0) return msg;
  }
  return fallback;
}
