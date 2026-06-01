import { createZodDto } from "nestjs-zod";
import { z } from "zod";

export const claimGuestSessionSchema = z.object({
  sessionId: z
    .uuid()
    .optional()
    .describe(
      "Optionnel : doit correspondre au cookie invité httpOnly si fourni (sinon ignoré, le cookie fait foi)",
    ),
});

export class ClaimGuestSessionDto extends createZodDto(claimGuestSessionSchema) {}
