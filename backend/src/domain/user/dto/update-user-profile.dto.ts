import { createZodDto } from "nestjs-zod";
import { z } from "zod";
import {
  normalizeSignupWebsiteUrl,
  SIGNUP_WEBSITE_URL_MAX_LENGTH,
} from "../signup-metadata.validation";

const websiteUrlField = z
  .union([z.string().max(SIGNUP_WEBSITE_URL_MAX_LENGTH), z.null()])
  .optional()
  .transform((value) => (value === undefined ? undefined : normalizeSignupWebsiteUrl(value)))
  .describe("URL du site (null pour effacer)");

export const updateUserProfileSchema = z.object({
  username: z.string().min(1).max(200).nullable().optional().describe("Nom affiché"),
  websiteUrl: websiteUrlField,
  pendingAutoAnalyze: z.boolean().optional(),
});

export class UpdateUserProfileDto extends createZodDto(updateUserProfileSchema) {}
