import { Injectable } from "@nestjs/common";

import type { CatalogProduct } from "../../../domain/catalog/types/catalog.types";
import type { ShopCategoryNode } from "../../../domain/shop/types/shop-category.types";
import { resolveExportCategoryPath, type CategoryOverrideMap } from "./category-tree-matcher";
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
 * Construit la valeur « Catégories » à partir de l’arbre magasin (ou fabricant si pas de match).
 */
export function buildCategoriesCell(
  product: CatalogProduct,
  categoryTree: ShopCategoryNode[] = [],
  overrides: CategoryOverrideMap = new Map(),
): string {
  return resolveExportCategoryPath(product, categoryTree, overrides);
}

/**
 * Mapping pur catalogue → lignes products.csv PrestaShop.
 */
@Injectable()
export class PrestashopProductMapper {
  /**
   * @param products Produits catalogue
   * @param references Map `productId → référence` déjà validée
   * @param importIds Map `productId → ID numérique FicheProduit` (aligné déclinaisons)
   * @param categoryTree Arborescence magasin pour résoudre les chemins PrestaShop
   * @param categoryOverrides Overrides manuels `sourceKey → nodeId` (session d’export)
   */
  map(
    products: CatalogProduct[],
    references: Map<string, string>,
    importIds: Map<string, string>,
    categoryTree: ShopCategoryNode[] = [],
    categoryOverrides: CategoryOverrideMap = new Map(),
  ): PrestashopProductRow[] {
    return products.map((product) =>
      this.mapOne(product, references, importIds, categoryTree, categoryOverrides),
    );
  }

  private mapOne(
    product: CatalogProduct,
    references: Map<string, string>,
    importIds: Map<string, string>,
    categoryTree: ShopCategoryNode[],
    categoryOverrides: CategoryOverrideMap,
  ): PrestashopProductRow {
    const row = emptyProductRow();
    const reference = references.get(product.id) ?? "";
    const importId = importIds.get(product.id) ?? "";

    row["ID"] = importId;
    row["Actif (0/1)"] = "1";
    row["Nom *"] = product.name;
    row["Catégories (x,y,z...)"] = resolveExportCategoryPath(
      product,
      categoryTree,
      categoryOverrides,
    );
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
