/** Libellés canoniques français pour les champs extraits du JSON-LD Product. */
export const JSON_LD_FIELD_LABELS = {
  productName: "Nom du produit",
  sku: "Référence (SKU)",
  shortDescription: "Description courte",
  imageUrl: "URL image",
  variantSku: "Référence variante (SKU)",
} as const;

export function jsonLdPriceFieldLabel(currency?: string): string {
  return currency ? `Prix (${currency})` : "Prix";
}
