import { createZodDto } from "nestjs-zod";
import { z } from "zod";

export const catalogSearchSchema = z.object({
  sector: z.string().trim().min(1).optional().describe("Filtre secteur : valeur exacte"),
  brands: z
    .array(z.string().trim().min(1))
    .max(100)
    .optional()
    .describe(
      "Marques à inclure (correspondance insensible à la casse, une requête par marque puis fusion)",
    ),
  categories: z
    .array(z.string().trim().min(1))
    .max(100)
    .optional()
    .describe("Filtre catégories (liste : correspondance IN)"),
  subcategories: z
    .array(z.string().trim().min(1))
    .max(100)
    .optional()
    .describe("Filtre sous-catégories (liste : correspondance IN)"),
  minYear: z.number().int().optional().describe("Année modèle minimale (inclus)"),
  maxYear: z.number().int().optional().describe("Année modèle maximale (inclus)"),
  minPrice: z.number().nonnegative().optional().describe("Prix minimal (inclus)"),
  maxPrice: z.number().nonnegative().optional().describe("Prix maximal (inclus)"),
  attributes: z
    .record(z.string().trim().min(1), z.string().trim().min(1))
    .optional()
    .describe("Paires clé / valeur appariées sur le JSON `attributes` (contains)"),
  limit: z
    .number()
    .int()
    .min(1)
    .max(1000)
    .optional()
    .describe("Nombre maximal de lignes retournées (valeur par défaut côté serveur si omis)"),
});

export class CatalogSearchDto extends createZodDto(catalogSearchSchema) {}
