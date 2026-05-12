import { createZodDto } from "nestjs-zod";
import { z } from "zod";

export const updateUserProfileSchema = z.object({
  username: z.string().min(1).max(200).nullable().optional().describe("Nom affiché"),
  websiteUrl: z.union([z.string().url(), z.null()]).optional().describe("URL du site (null pour effacer)"),
  pendingAutoAnalyze: z.boolean().optional(),
});

export class UpdateUserProfileDto extends createZodDto(updateUserProfileSchema) {}
