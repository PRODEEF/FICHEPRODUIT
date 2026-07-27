import { Injectable } from "@nestjs/common";

import type { CatalogProduct } from "../../../domain/catalog/types/catalog.types";
import { PRESTASHOP_PRODUCT_HEADERS, type PrestashopProductHeader } from "./prestashop-headers";
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

    row["Actif (0/1)"] = "1";
    row["Nom *"] = product.name;
    row["Catégories (x,y,z...)"] = buildCategoriesCell(product);
    row["Prix hors taxe"] = formatPrice(product.price);
    row["Référence #"] = reference;
    row["Marque"] = product.brand;
    row["Résumé"] = product.description ?? "";
    row["Description"] = product.detailedDescription ?? "";
    row["URL des images (x,y,z...)"] = product.images.join(",");
    row["État"] = readAttr(product, "condition");
    row["Disponible à la commande (0 = Non, 1 = Oui)"] = "1";
    row["Afficher le prix (0 = Non, 1 = Oui)"] = "1";

    return row;
  }
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
