import { Injectable } from "@nestjs/common";
import type { CatalogProduct } from "@/domain/catalog/types/catalog.types";
import type { ProductTemplateField } from "@/domain/product-template/types/product-template.types";
import type { MappedField } from "../types/export.types";

/** Correspondance insensible à la casse entre libellés template et champs catalogue connus. */
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
  "image urls": (p) => p.images.join("|"),
  images: (p) => p.images.join("|"),
  url: (p) => p.url,
  year: (p) => String(p.year),
  année: (p) => String(p.year),
};

/**
 * Remplit les colonnes du template sans appeler l’IA lorsque la donnée est déjà présente
 * sur le produit catalogue ou dans `attributes`.
 */
@Injectable()
export class FieldMapperService {
  /**
   * @returns Champs résolus immédiatement et sous-ensemble à compléter par l’IA.
   */
  mapDirectFields(
    product: CatalogProduct,
    templateFields: ProductTemplateField[],
  ): { mapped: MappedField[]; unresolved: ProductTemplateField[] } {
    const mapped: MappedField[] = [];
    const unresolved: ProductTemplateField[] = [];

    for (const field of templateFields) {
      const key = field.name.toLowerCase().trim();

      const directFn = DIRECT_MAPPINGS[key];
      if (directFn) {
        mapped.push({ templateFieldName: field.name, value: directFn(product), source: "direct" });
        continue;
      }

      const attrValue = this.findInAttributes(product, key);
      if (attrValue !== null) {
        mapped.push({ templateFieldName: field.name, value: attrValue, source: "direct" });
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
