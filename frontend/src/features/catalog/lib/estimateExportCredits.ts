import type { BillingSummary, CatalogProduct } from '@types-api';

/** Aligné sur backend/src/domain/billing/credit-ledger.service.ts (FREE_LOW_PRICE_THRESHOLD_EUR). */
export const EXPORT_FREE_PRICE_THRESHOLD_EUR = 200;

export interface ExportCreditsEstimate {
  requiredCredits: number;
  availableCredits: number;
  hasEnoughCredits: boolean;
}

function isProductFreeForExport(product: CatalogProduct, hasFreeLowPriceExports: boolean): boolean {
  return hasFreeLowPriceExports && product.price < EXPORT_FREE_PRICE_THRESHOLD_EUR;
}

/** Retourne la date d’expiration de l’entitlement fiches &lt; 200 €, ou null si inactif. */
export function getFreeLowPriceExportsExpiresAt(summary: BillingSummary | null): string | null {
  if (!summary) return null;
  const now = Date.now();
  const active = summary.entitlements.find(
    (entitlement) => new Date(entitlement.expiresAt).getTime() > now,
  );
  return active?.expiresAt ?? null;
}

export function hasActiveFreeLowPriceExports(summary: BillingSummary | null): boolean {
  return getFreeLowPriceExportsExpiresAt(summary) !== null;
}

/** Nombre de fiches sélectionnées éligibles au forfait fiches &lt; 200 €. */
export function countFreeExportProducts(
  selectedProducts: CatalogProduct[],
  hasFreeLowPriceExports: boolean,
): number {
  if (!hasFreeLowPriceExports) return 0;
  return selectedProducts.filter((product) => isProductFreeForExport(product, true)).length;
}

/**
 * Estime le nombre de crédits nécessaires pour exporter les produits sélectionnés.
 * Miroir simplifié des règles backend : 1 crédit / produit facturable, 0 si exports illimités.
 */
export function estimateExportCredits(
  selectedProducts: CatalogProduct[],
  selectionCount: number,
  summary: BillingSummary | null,
): ExportCreditsEstimate {
  const availableCredits = summary?.balance ?? 0;

  if (summary?.hasUnlimitedExports) {
    return { requiredCredits: 0, availableCredits, hasEnoughCredits: true };
  }

  const hasFreeLowPriceExports = hasActiveFreeLowPriceExports(summary);

  const billableFromProducts = selectedProducts.filter(
    (product) => !isProductFreeForExport(product, hasFreeLowPriceExports),
  ).length;

  // Filet : si le décompte affiché dépasse les produits résolus, on facture la sélection complète.
  const requiredCredits =
    selectionCount > selectedProducts.length ? selectionCount : billableFromProducts;

  return {
    requiredCredits,
    availableCredits,
    hasEnoughCredits: requiredCredits <= availableCredits,
  };
}
