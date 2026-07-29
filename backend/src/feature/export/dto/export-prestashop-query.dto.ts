import { createZodDto } from "nestjs-zod";
import { z } from "zod";

import { PRESTASHOP_EXPORT_MAX_PRODUCTS } from "../prestashop/prestashop-export.constants";

const exportMaxProductsMessage = `La sélection est limitée à ${PRESTASHOP_EXPORT_MAX_PRODUCTS} produits par export`;

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

/**
 * Parse `categoryOverrides` JSON depuis la query :
 * `[{"sourceKey":"kitesurf|ailes","targetNodeId":"<uuid>|""}]`
 */
function parseCategoryOverrides(value: unknown): unknown {
  if (value === undefined || value === null || value === "") return [];
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return value;
  }
}

export const categoryOverrideSchema = z.object({
  sourceKey: z.string().trim().min(1).max(200),
  /** UUID nœud magasin, ou chaîne vide = forcer catégories fabricant */
  targetNodeId: z.union([z.uuid(), z.literal("")]),
});

export const exportProductIdsSchema = z
  .array(z.uuid())
  .min(1, "Sélectionne au moins un produit")
  .max(PRESTASHOP_EXPORT_MAX_PRODUCTS, exportMaxProductsMessage)
  .describe("UUID des produits catalogue sélectionnés");

export const exportPrestashopBodySchema = z.object({
  type: z.enum(["products", "combinations"]).describe("Type de fichier CSV PrestaShop à générer"),
  shopId: z.uuid().describe("UUID de la boutique (contrôle d’accès propriétaire)"),
  productIds: exportProductIdsSchema,
  categoryOverrides: z.array(categoryOverrideSchema).max(200).optional().default([]),
});

export class ExportPrestashopBodyDto extends createZodDto(exportPrestashopBodySchema) {}

export const exportCategoryPreviewBodySchema = z.object({
  shopId: z.uuid().describe("UUID de la boutique"),
  productIds: exportProductIdsSchema,
});

export class ExportCategoryPreviewBodyDto extends createZodDto(exportCategoryPreviewBodySchema) {}

/** @deprecated Préférer POST + {@link ExportPrestashopBodyDto} (évite les URLs trop longues). */
export const exportPrestashopQuerySchema = z.object({
  type: z.enum(["products", "combinations"]).describe("Type de fichier CSV PrestaShop à générer"),
  shopId: z.uuid().describe("UUID de la boutique (contrôle d’accès propriétaire)"),
  productIds: z.preprocess(parseProductIds, exportProductIdsSchema),
  categoryOverrides: z.preprocess(
    parseCategoryOverrides,
    z.array(categoryOverrideSchema).max(200).optional().default([]),
  ),
});

export class ExportPrestashopQueryDto extends createZodDto(exportPrestashopQuerySchema) {}

/** @deprecated Préférer POST + {@link ExportCategoryPreviewBodyDto}. */
export const exportCategoryPreviewQuerySchema = z.object({
  shopId: z.uuid().describe("UUID de la boutique"),
  productIds: z.preprocess(parseProductIds, exportProductIdsSchema),
});

export class ExportCategoryPreviewQueryDto extends createZodDto(exportCategoryPreviewQuerySchema) {}
