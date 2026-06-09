import type { ShopSectorLabel } from '@shared/lib/shopSectors';

/** Secteur affiché par défaut sur la page tarifs. */
export const DEFAULT_PRICING_SECTOR: ShopSectorLabel = 'Glisse';

const DEFAULT_CONTACT_EMAIL = 'contact@prodeef.com';

/** Adresse de contact commerciale (variable `VITE_CONTACT_EMAIL`). */
export function getContactEmail(): string {
  const fromEnv = import.meta.env.VITE_CONTACT_EMAIL?.trim();
  return fromEnv && fromEnv.length > 0 ? fromEnv : DEFAULT_CONTACT_EMAIL;
}

/** Lien mailto prérempli pour une demande de devis Business Custom. */
export function buildBusinessCustomContactMailto(sector: ShopSectorLabel): string {
  const subject = encodeURIComponent(`Demande pack Business Custom — secteur ${sector}`);
  const body = encodeURIComponent(
    `Bonjour,\n\nJe souhaite obtenir un devis pour le pack Business Custom (secteur ${sector}).\n\n`,
  );
  return `mailto:${getContactEmail()}?subject=${subject}&body=${body}`;
}

/** Suffixe affiché à côté des montants tarifaires. */
export const PRICE_EXCL_TAX_LABEL = 'HT';

/** Mention légale sous la grille de forfaits. */
export const PRICING_EXCL_TAX_NOTICE = 'Tous les prix sont indiqués hors taxes.';
