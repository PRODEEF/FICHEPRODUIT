import { createZodDto } from "nestjs-zod";
import { z } from "zod";
import { FIELD_TYPES } from "../types/product-template.types";

const productTemplateFieldResponseSchema = z.object({
  name: z.string().describe("Nom logique du champ export"),
  type: z.enum(FIELD_TYPES).describe("Type métier du champ"),
  required: z.boolean().describe("Champ obligatoire dans l’export"),
  order: z.number().describe("Position d’affichage / tri"),
});

/** Réponse complète d’un gabarit (template) produit */
export const productTemplateResponseSchema = z.object({
  id: z.string().uuid().describe("Identifiant du template"),
  name: z.string().describe("Libellé du gabarit"),
  shopId: z.string().uuid().describe("Boutique propriétaire"),
  fields: z.array(productTemplateFieldResponseSchema).describe("Champs du gabarit"),
  createdAt: z.string().describe("Date de création (ISO 8601)"),
  updatedAt: z.string().describe("Date de mise à jour (ISO 8601)"),
});

export class ProductTemplateResponseDto extends createZodDto(productTemplateResponseSchema) {}

const scrapeWarningSchema = z.object({
  code: z.string().describe("Code d’avertissement"),
  message: z.string().describe("Message lisible"),
});

/** Résultat de la détection de champs depuis une page produit */
export const scrapeFieldsResultSchema = z.object({
  fields: z.array(productTemplateFieldResponseSchema).describe("Champs détectés"),
  sampleValues: z
    .record(z.string(), z.string())
    .describe("Valeurs exemple extraites de la page, par nom de champ"),
  warnings: z.array(scrapeWarningSchema).describe("Avertissements non bloquants"),
});

export class ScrapeFieldsResultDto extends createZodDto(scrapeFieldsResultSchema) {}

/** Résultat du raffinement des champs par l’IA */
export const refineFieldsResultSchema = z.object({
  fields: z.array(productTemplateFieldResponseSchema).describe("Champs après raffinement"),
  refinedWithAi: z.boolean().describe("True si le modèle a effectivement affiné les champs"),
  message: z.string().optional().describe("Message informatif (succès, échec ou clé API absente)"),
});

export class RefineFieldsResultDto extends createZodDto(refineFieldsResultSchema) {}
