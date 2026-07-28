import { createZodDto } from "nestjs-zod";
import { z } from "zod";

/**
 * Parse `productIds` depuis la query :
 * - `uuid1,uuid2` (chaîne CSV)
 * - ou tableau déjà parsé par le framework
 */
function parseProductIds(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.flatMap((item) =>
      typeof item === "string" ? item.split(",").map((s) => s.trim()) : item,
    );
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }
  return value;
}

export const exportPrestashopQuerySchema = z.object({
  type: z.enum(["products", "combinations"]).describe("Type de fichier CSV PrestaShop à générer"),
  shopId: z.uuid().describe("UUID de la boutique (contrôle d’accès propriétaire)"),
  productIds: z.preprocess(
    parseProductIds,
    z
      .array(z.uuid())
      .min(1, "Sélectionne au moins un produit")
      .max(500, "La sélection est limitée à 500 produits")
      .describe("UUID des produits catalogue sélectionnés"),
  ),
});

export class ExportPrestashopQueryDto extends createZodDto(exportPrestashopQuerySchema) {}
