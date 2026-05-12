import { z } from "zod";
import { createZodDto } from "nestjs-zod";
import { FIELD_TYPES } from "../types/product-template.types";

const fieldSchema = z.object({
  name: z.string().min(1).max(255).describe("Nom logique du champ"),
  type: z.enum(FIELD_TYPES).describe("Type métier du champ"),
  required: z.boolean().default(false).describe("Champ obligatoire dans l’export"),
});

export const refineFieldsSchema = z.object({
  source: z
    .enum(["csv_import", "product_page", "manual"])
    .describe("Contexte d’origine des champs (import CSV, page produit, saisie manuelle)"),
  fields: z.array(fieldSchema).min(1).describe("Champs à affiner"),
  sampleValues: z
    .record(z.string(), z.string())
    .optional()
    .describe("Exemples de valeurs par nom de champ (optionnel, aide le modèle)"),
});

export class RefineFieldsDto extends createZodDto(refineFieldsSchema) {}
