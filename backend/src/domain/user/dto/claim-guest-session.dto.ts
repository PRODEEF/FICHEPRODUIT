import { createZodDto } from "nestjs-zod";
import { z } from "zod";

export const claimGuestSessionSchema = z.object({
  sessionId: z
    .uuid()
    .optional()
    .describe("Identifiant de session invité (optionnel si le cookie invité est envoyé avec la requête)"),
});

export class ClaimGuestSessionDto extends createZodDto(claimGuestSessionSchema) {}
