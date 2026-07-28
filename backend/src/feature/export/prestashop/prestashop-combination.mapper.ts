import { Injectable } from "@nestjs/common";

import type { CatalogProduct } from "../../../domain/catalog/types/catalog.types";
import {
  PRESTASHOP_COMBINATION_HEADERS,
  type PrestashopCombinationHeader,
} from "./prestashop-headers";
import { toPrestashopImportId } from "./prestashop-reference";
import type {
  PrestashopAttributeChoice,
  PrestashopAttributeType,
  PrestashopCombinationRow,
} from "./prestashop.types";

type VariantGroup = {
  name: string;
  type: PrestashopAttributeType;
  position: number;
  values: string[];
};

function emptyCombinationRow(): PrestashopCombinationRow {
  const row = {} as PrestashopCombinationRow;
  for (const header of PRESTASHOP_COMBINATION_HEADERS) {
    row[header] = "";
  }
  return row;
}

/**
 * Découpe une valeur multi-attributs (`a, b, c`) en liste ordonnée non vide.
 */
export function splitMultiValue(raw: string): string[] {
  return raw
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

/**
 * Groupes d’attributs variant connus, ordre stable : couleur puis taille.
 * Position 0..n-1 dans cet ordre.
 */
export function extractVariantGroups(attributes: Record<string, string>): VariantGroup[] {
  const groups: VariantGroup[] = [];

  const colorRaw = attributes["couleur"] ?? attributes["color"];
  if (typeof colorRaw === "string" && colorRaw.trim().length > 0) {
    const values = splitMultiValue(colorRaw);
    if (values.length > 0) {
      groups.push({
        name: "Couleur",
        type: "color",
        position: groups.length,
        values,
      });
    }
  }

  const sizeRaw = attributes["taille"] ?? attributes["size"];
  if (typeof sizeRaw === "string" && sizeRaw.trim().length > 0) {
    const values = splitMultiValue(sizeRaw);
    if (values.length > 0) {
      groups.push({
        name: "Taille",
        type: "select",
        position: groups.length,
        values,
      });
    }
  }

  return groups;
}

/**
 * Produit cartésien des groupes → listes de choix ordonnés.
 */
export function cartesianAttributeChoices(groups: VariantGroup[]): PrestashopAttributeChoice[][] {
  if (groups.length === 0) return [];

  let combos: PrestashopAttributeChoice[][] = [[]];

  for (const group of groups) {
    const next: PrestashopAttributeChoice[][] = [];
    for (const combo of combos) {
      for (const value of group.values) {
        next.push([
          ...combo,
          {
            name: group.name,
            type: group.type,
            position: group.position,
            value,
          },
        ]);
      }
    }
    combos = next;
  }

  return combos;
}

/**
 * Construit les colonnes attribut / valeur en **une seule passe** sur la liste ordonnée
 * (alignement index par index obligatoire).
 */
export function buildAttributeColumns(choices: PrestashopAttributeChoice[]): {
  attributeGroups: string;
  attributeValues: string;
} {
  const groupParts: string[] = [];
  const valueParts: string[] = [];

  for (const choice of choices) {
    groupParts.push(`${choice.name}:${choice.type}:${choice.position}`);
    valueParts.push(`${choice.value}:${choice.position}`);
  }

  return {
    attributeGroups: groupParts.join(","),
    attributeValues: valueParts.join(","),
  };
}

/**
 * Mapping pur catalogue → lignes combinations.csv PrestaShop.
 * Produits sans attributs variant connus → aucune ligne.
 * Exactement une ligne `Défaut = 1` par produit ayant des déclinaisons (la première).
 */
@Injectable()
export class PrestashopCombinationMapper {
  /**
   * @param products Produits catalogue
   * @param references Map `productId → référence` déjà validée
   */
  map(products: CatalogProduct[], references: Map<string, string>): PrestashopCombinationRow[] {
    const rows: PrestashopCombinationRow[] = [];

    for (const product of products) {
      const productRef = references.get(product.id);
      if (productRef === undefined) continue;

      const groups = extractVariantGroups(product.attributes);
      const combos = cartesianAttributeChoices(groups);
      if (combos.length === 0) continue;

      combos.forEach((choices, index) => {
        rows.push(this.mapOne(productRef, choices, index === 0));
      });
    }

    return rows;
  }

  private mapOne(
    productRef: string,
    choices: PrestashopAttributeChoice[],
    isDefault: boolean,
  ): PrestashopCombinationRow {
    const row = emptyCombinationRow();
    const { attributeGroups, attributeValues } = buildAttributeColumns(choices);

    row["ID produit*"] = toPrestashopImportId(productRef);
    row["Attribut (Nom:Type:Position)*"] = attributeGroups;
    row["Valeur (Valeur:Position)*"] = attributeValues;
    row["Référence"] = buildCombinationReference(productRef, choices);
    row["Défaut (0 = Non, 1 = Oui)"] = isDefault ? "1" : "0";
    row["Quantité minimale"] = "1";

    return row;
  }
}

function buildCombinationReference(
  productRef: string,
  choices: PrestashopAttributeChoice[],
): string {
  const suffix = choices.map((c) => c.value).join("-");
  return suffix.length > 0 ? `${productRef}-${suffix}` : productRef;
}

/** Accès typé à une cellule déclinaison (tests). */
export function combinationCell(
  row: PrestashopCombinationRow,
  header: PrestashopCombinationHeader,
): string {
  return row[header];
}
