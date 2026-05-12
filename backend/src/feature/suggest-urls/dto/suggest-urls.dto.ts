import { createZodDto } from "nestjs-zod";
import { z } from "zod";

export const suggestUrlsSchema = z.object({
  q: z
    .string({ error: "Paramètre q manquant" })
    .min(1, "Paramètre q manquant")
    .transform((v) => v.trim()),
});

export class SuggestUrlsDto extends createZodDto(suggestUrlsSchema) {}
