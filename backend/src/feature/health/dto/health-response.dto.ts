import { createZodDto } from "nestjs-zod";
import { z } from "zod";

export const healthResponseSchema = z.object({
  status: z.enum(["ok", "degraded", "error"]).describe("État global du service"),
  timestamp: z.string().describe("Horodatage ISO 8601"),
  environment: z.string().describe("Environnement d'exécution"),
  services: z.object({
    database: z.enum(["ok", "error"]).describe("Disponibilité de la base"),
  }),
});

export class HealthResponseDto extends createZodDto(healthResponseSchema) {}
