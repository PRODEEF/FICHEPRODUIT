import { createZodDto } from "nestjs-zod";
import { z } from "zod";

export const userMeResponseSchema = z.object({
  id: z.uuid().describe("Identifiant Supabase Auth"),
  email: z.email().describe("Adresse e-mail du compte"),
  username: z.string().nullable().describe("Nom affiché (display_name)"),
  websiteUrl: z.string().url().nullable().describe("URL du site du commerçant"),
  pendingAutoAnalyze: z.boolean().describe("File d’attente d’analyse automatique"),
  createdAt: z.string().describe("Création du profil (ISO 8601)"),
  updatedAt: z.string().describe("Dernière mise à jour (ISO 8601)"),
});

export class UserMeResponseDto extends createZodDto(userMeResponseSchema) {}
