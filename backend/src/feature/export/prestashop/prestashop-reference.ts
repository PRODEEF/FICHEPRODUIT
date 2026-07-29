import type { CatalogProduct } from "../../../domain/catalog/types/catalog.types";

/** Limite PrestaShop 8 pour `Product->reference` / ID import. */
export const PRESTASHOP_REFERENCE_MAX_LENGTH = 64;

/** Référence produit absente ou vide. */
export class MissingProductReferenceError extends Error {
  readonly productId: string;

  constructor(productId: string) {
    super(`Référence manquante pour le produit ${productId}`);
    this.name = "MissingProductReferenceError";
    this.productId = productId;
  }
}

/**
 * Conservé pour compatibilité des tests / appelants historiques.
 * Les doublons sont désormais désambiguïsés à l'export (voir {@link validateProductReferences}).
 */
export class DuplicateProductReferenceError extends Error {
  readonly reference: string;

  constructor(reference: string) {
    super(`Référence dupliquée dans la sélection : ${reference}`);
    this.name = "DuplicateProductReferenceError";
    this.reference = reference;
  }
}

/** Suffixe court dérivé de l'UUID produit pour rendre une référence unique. */
export function disambiguateReference(reference: string, productId: string): string {
  const suffix = productId.replaceAll("-", "").slice(0, 8);
  const combined = `${reference}-${suffix}`;
  if (combined.length <= PRESTASHOP_REFERENCE_MAX_LENGTH) {
    return combined;
  }
  const maxBase = PRESTASHOP_REFERENCE_MAX_LENGTH - 1 - suffix.length;
  return `${reference.slice(0, Math.max(1, maxBase))}-${suffix}`;
}

/** Référence de secours courte dérivée de l'UUID (toujours ≤ 64). */
export function fallbackReferenceFromProductId(productId: string): string {
  return productId.replaceAll("-", "").slice(0, PRESTASHOP_REFERENCE_MAX_LENGTH);
}

/**
 * Une référence PrestaShop doit être courte et ne pas ressembler à un dump JSON / i18n.
 */
export function isUsablePrestashopReference(reference: string): boolean {
  if (reference.length === 0 || reference.length > PRESTASHOP_REFERENCE_MAX_LENGTH) {
    return false;
  }
  if (reference.includes('{"') || reference.includes("Choose your region")) {
    return false;
  }
  if ((reference.match(/,/g) ?? []).length > 5) {
    return false;
  }
  return true;
}

/**
 * Extrait et valide les références fabricant (`attributes.reference`).
 * Obligatoires. Références invalides (trop longues / dump CMS) → fallback UUID.
 * Doublons → suffixe unique (limite 64 caractères PrestaShop).
 *
 * @returns Map `catalogProductId → référence` (éventuellement assainie / désambiguïsée)
 */
export function validateProductReferences(products: CatalogProduct[]): Map<string, string> {
  const byProductId = new Map<string, string>();
  const seenRefs = new Map<string, string>();

  for (const product of products) {
    const raw = product.attributes["reference"];
    const trimmed = typeof raw === "string" ? raw.trim() : "";

    if (trimmed.length === 0) {
      throw new MissingProductReferenceError(product.id);
    }

    let reference = trimmed;
    if (!isUsablePrestashopReference(reference)) {
      reference = fallbackReferenceFromProductId(product.id);
    }

    const previousProductId = seenRefs.get(reference);
    if (previousProductId !== undefined) {
      const before = reference;
      reference = disambiguateReference(reference, product.id);
      let guard = 0;
      while (seenRefs.has(reference) && guard < 5) {
        reference = disambiguateReference(`${before}${guard}`, product.id);
        guard += 1;
      }
    }

    seenRefs.set(reference, product.id);
    byProductId.set(product.id, reference);
  }

  return byProductId;
}

/** Limite `id_product` PrestaShop (colonne MySQL INT UNSIGNED). */
export const PRESTASHOP_PRODUCT_ID_MAX = 4_294_967_295;

/**
 * Marqueur documentaire de la plage FicheProduit (987456 → offset 900M).
 * Les tests historiques l'utilisent comme ID mock court.
 */
export const FICHEPRODUIT_PRESTASHOP_ID_BASE = 987456;

/** Début de la plage d'IDs stables FicheProduit (900M–999M). */
export const FICHEPRODUIT_PRESTASHOP_ID_OFFSET = 900_000_000;

/** Nombre d'IDs distincts disponibles dans la plage FicheProduit. */
const FICHEPRODUIT_PRESTASHOP_ID_SPAN = 100_000_000;

/**
 * Hash FNV-1a 32 bits déterministe : même UUID → même nombre à chaque appel.
 */
function stableNumericHash(uuid: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < uuid.length; i++) {
    hash ^= uuid.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0) % 1_000_000;
}

/**
 * Attribue un ID numérique **stable** par produit : même UUID → même ID à chaque export.
 * Format : `FICHEPRODUIT_PRESTASHOP_ID_OFFSET + hash(uuid) % SPAN` (plage 900M–999M, ≤ INT UNSIGNED).
 * En cas de collision de hash, on incrémente jusqu'à trouver un slot libre.
 */
export function assignPrestashopImportIds(
  products: ReadonlyArray<{ id: string }>,
): Map<string, string> {
  const byProductId = new Map<string, string>();
  const usedIds = new Set<string>();

  for (const product of products) {
    let numericId = String(
      FICHEPRODUIT_PRESTASHOP_ID_OFFSET +
        (stableNumericHash(product.id) % FICHEPRODUIT_PRESTASHOP_ID_SPAN),
    );
    let guard = 0;
    while (usedIds.has(numericId) && guard < 100) {
      numericId = String(Number(numericId) + 1);
      guard += 1;
    }
    usedIds.add(numericId);
    byProductId.set(product.id, numericId);
  }

  return byProductId;
}
