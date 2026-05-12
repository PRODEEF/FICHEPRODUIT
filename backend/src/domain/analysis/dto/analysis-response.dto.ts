import { createZodDto } from "nestjs-zod";
import { z } from "zod";

const analysisStatusSchema = z.enum(["pending", "running", "done", "failed"]);

const analysisErrorCodeSchema = z.enum([
  "SITE_UNREACHABLE",
  "UNANALYZABLE",
  "UNKNOWN_SECTOR",
  "INTERNAL_ERROR",
]);

export const analysisResponseSchema = z.object({
  id: z.uuid().describe("Identifiant unique de l'analyse"),
  url: z.url().describe("URL du site e-commerce analysé"),
  status: analysisStatusSchema.describe("État du pipeline d'analyse"),
  errorCode: analysisErrorCodeSchema
    .nullable()
    .describe("Code d'erreur métier si le statut est failed"),
  errorMessage: z.string().nullable().describe("Message d'erreur détaillé si le statut est failed"),
  userId: z.uuid().nullable().describe("Utilisateur propriétaire (null pour un parcours invité)"),
  sessionId: z
    .uuid()
    .nullable()
    .describe("Identifiant de session invité (null si utilisateur connecté)"),
  shopId: z.uuid().nullable().describe("Boutique associée une fois l'analyse terminée avec succès"),
  createdAt: z.string().describe("Date de création au format ISO 8601"),
});

export class AnalysisResponseDto extends createZodDto(analysisResponseSchema) {}
