import { Injectable } from "@nestjs/common";

import type { CatalogProduct } from "../../../domain/catalog/types/catalog.types";
import type { ExportField } from "../types/export-field.types";
import type { MappedField } from "../types/export.types";

/** Correspondance insensible à la casse entre libellés d’export et champs catalogue connus. */
const DIRECT_MAPPINGS: Record<string, (p: CatalogProduct) => string> = {
  name: (p) => p.name,
  nom: (p) => p.name,
  "product name": (p) => p.name,
  reference: (p) => p.id,
  price: (p) => String(p.price),
  prix: (p) => String(p.price),
  brand: (p) => p.brand,
  marque: (p) => p.brand,
  manufacturer: (p) => p.brand,
  category: (p) => p.category,
  categorie: (p) => p.category,
  description: (p) => p.description,
  "description détaillée": (p) => p.detailedDescription,
  "detailed description": (p) => p.detailedDescription,
  detailed_description: (p) => p.detailedDescription,
  "image urls": (p) => p.images.join("|"),
  images: (p) => p.images.join("|"),
  url: (p) => p.url,
  year: (p) => String(p.year),
  année: (p) => String(p.year),
};

/**
 * Remplit les colonnes d’export sans appeler l’IA lorsque la donnée est déjà présente
 * sur le produit catalogue ou dans `attributes`.
 */
@Injectable()
export class FieldMapperService {
  /**
   * @returns Champs résolus immédiatement et sous-ensemble à compléter par l’IA.
   */
  mapDirectFields(
    product: CatalogProduct,
    exportFields: ExportField[],
  ): { mapped: MappedField[]; unresolved: ExportField[] } {
    const mapped: MappedField[] = [];
    const unresolved: ExportField[] = [];

    for (const field of exportFields) {
      const key = field.name.toLowerCase().trim();

      const directFn = DIRECT_MAPPINGS[key];
      if (directFn) {
        mapped.push({ fieldName: field.name, value: directFn(product), source: "direct" });
        continue;
      }

      const attrValue = this.findInAttributes(product, key);
      if (attrValue !== null) {
        mapped.push({ fieldName: field.name, value: attrValue, source: "direct" });
        continue;
      }

      unresolved.push(field);
    }

    return { mapped, unresolved };
  }

  private findInAttributes(product: CatalogProduct, key: string): string | null {
    for (const [attrKey, attrVal] of Object.entries(product.attributes)) {
      if (attrKey.toLowerCase().trim() === key) return attrVal;
    }
    return null;
  }
}
