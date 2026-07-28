import { Injectable } from "@nestjs/common";

import type { CatalogProduct } from "../../../domain/catalog/types/catalog.types";
import { PRESTASHOP_PRODUCT_HEADERS, type PrestashopProductHeader } from "./prestashop-headers";
import { toPrestashopImportId } from "./prestashop-reference";
import type { PrestashopProductRow } from "./prestashop.types";

function emptyProductRow(): PrestashopProductRow {
  const row = {} as PrestashopProductRow;
  for (const header of PRESTASHOP_PRODUCT_HEADERS) {
    row[header] = "";
  }
  return row;
}

/**
 * Construit la valeur « Catégories » : noms plats séparés par `,`, sans hiérarchie `>`.
 */
export function buildCategoriesCell(product: CatalogProduct): string {
  const parts = [product.category.trim()];
  if (product.subCategory !== null && product.subCategory.trim().length > 0) {
    parts.push(product.subCategory.trim());
  }
  return parts.filter((p) => p.length > 0).join(",");
}

/**
 * Mapping pur catalogue → lignes products.csv PrestaShop.
 */
@Injectable()
export class PrestashopProductMapper {
  /**
   * @param products Produits catalogue
   * @param references Map `productId → référence` déjà validée
   */
  map(products: CatalogProduct[], references: Map<string, string>): PrestashopProductRow[] {
    return products.map((product) => this.mapOne(product, references));
  }

  private mapOne(product: CatalogProduct, references: Map<string, string>): PrestashopProductRow {
    const row = emptyProductRow();
    const reference = references.get(product.id) ?? "";

    // ID sans tirets (aligné sur ID produit* des déclinaisons)
    row["ID"] = toPrestashopImportId(reference);
    row["Actif (0/1)"] = "1";
    row["Nom *"] = product.name;
    row["Catégories (x,y,z...)"] = buildCategoriesCell(product);
    row["Prix hors taxe"] = formatPrice(product.price);
    row["Référence #"] = reference;
    row["Marque"] = product.brand;
    row["Résumé"] = product.description ?? "";
    row["Description"] = product.detailedDescription ?? "";
    row["URL des images (x,y,z...)"] = product.images.join(",");
    row["État"] = mapProductCondition(readAttr(product, "condition"));
    row["Disponible à la commande (0 = Non, 1 = Oui)"] = "1";
    row["Afficher le prix (0 = Non, 1 = Oui)"] = "1";

    return row;
  }
}

const PRESTASHOP_CONDITIONS = new Set(["new", "used", "refurbished"]);

/**
 * Normalise l’attribut catalogue `condition` vers les valeurs PrestaShop
 * (`new` | `used` | `refurbished`). Valeur absente ou inconnue → `new`.
 */
export function mapProductCondition(raw: string): string {
  const normalized = raw.trim().toLowerCase();
  if (normalized.length === 0) return "new";
  if (PRESTASHOP_CONDITIONS.has(normalized)) return normalized;

  if (
    normalized === "neuf" ||
    normalized === "nouveau" ||
    normalized === "nouvelle" ||
    normalized === "brand new"
  ) {
    return "new";
  }
  if (
    normalized === "occasion" ||
    normalized === "usagé" ||
    normalized === "usage" ||
    normalized === "seconde main" ||
    normalized === "second hand"
  ) {
    return "used";
  }
  if (
    normalized === "reconditionné" ||
    normalized === "reconditionne" ||
    normalized === "remis à neuf" ||
    normalized === "remis a neuf"
  ) {
    return "refurbished";
  }

  return "new";
}

function formatPrice(price: number): string {
  if (!Number.isFinite(price)) return "";
  return String(price);
}

function readAttr(product: CatalogProduct, key: string): string {
  const value = product.attributes[key];
  return typeof value === "string" ? value : "";
}

/** Accès typé à une cellule produit (tests). */
export function productCell(row: PrestashopProductRow, header: PrestashopProductHeader): string {
  return row[header];
}
