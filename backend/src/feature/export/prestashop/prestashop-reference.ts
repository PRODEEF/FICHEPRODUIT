import type { CatalogProduct } from "../../../domain/catalog/types/catalog.types";

/** Référence produit absente ou vide. */
export class MissingProductReferenceError extends Error {
  readonly productId: string;

  constructor(productId: string) {
    super(`Référence manquante pour le produit ${productId}`);
    this.name = "MissingProductReferenceError";
    this.productId = productId;
  }
}

/** Même référence présente sur plusieurs produits de la sélection. */
export class DuplicateProductReferenceError extends Error {
  readonly reference: string;

  constructor(reference: string) {
    super(`Référence dupliquée dans la sélection : ${reference}`);
    this.name = "DuplicateProductReferenceError";
    this.reference = reference;
  }
}

/**
 * Extrait et valide les références fabricant (`attributes.reference`).
 * Obligatoires et uniques dans la sélection d’export.
 *
 * @returns Map `catalogProductId → référence`
 */
export function validateProductReferences(products: CatalogProduct[]): Map<string, string> {
  const byProductId = new Map<string, string>();
  const seenRefs = new Map<string, string>();

  for (const product of products) {
    const raw = product.attributes["reference"];
    const reference = typeof raw === "string" ? raw.trim() : "";

    if (reference.length === 0) {
      throw new MissingProductReferenceError(product.id);
    }

    const previousProductId = seenRefs.get(reference);
    if (previousProductId !== undefined) {
      throw new DuplicateProductReferenceError(reference);
    }

    seenRefs.set(reference, product.id);
    byProductId.set(product.id, reference);
  }

  return byProductId;
}
