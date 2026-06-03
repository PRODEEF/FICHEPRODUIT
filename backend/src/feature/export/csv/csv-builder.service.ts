import { Injectable } from "@nestjs/common";
import type { MappedProduct } from "../types/export.types";

import type { ProductTemplateField } from "../../../domain/product-template/types/product-template.types";

/**
 * Construction d’un document CSV RFC‑4180 simplifié : guillemets si nécessaire, échappement des `"`.
 */
@Injectable()
export class CsvBuilderService {
  /**
   * Produit le CSV avec une ligne d’en‑tête = noms des champs du template, dans l’ordre donné.
   *
   * @param products Produits déjà mappés (une ligne par produit)
   * @param templateFields Ordre et libellés des colonnes (propriété `name`)
   */
  build(products: MappedProduct[], templateFields: ProductTemplateField[]): string {
    const headers = templateFields.map((f) => f.name);
    const rows = products.map((p) => this.buildRow(p, headers));
    return [this.serializeRow(headers), ...rows.map((r) => this.serializeRow(r))].join("\n");
  }

  private buildRow(product: MappedProduct, headers: string[]): string[] {
    return headers.map((header) => {
      const field = product.fields.find((f) => f.templateFieldName === header);
      return field?.value ?? "";
    });
  }

  private serializeRow(cells: string[]): string {
    return cells
      .map((cell) => {
        const escaped = cell.replace(/"/g, '""');
        const needsQuotes = /[",\n\r]/.test(escaped);
        return needsQuotes ? `"${escaped}"` : escaped;
      })
      .join(",");
  }
}
