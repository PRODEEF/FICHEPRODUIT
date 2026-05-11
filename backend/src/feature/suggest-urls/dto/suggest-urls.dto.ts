import { z } from "zod";
import { createZodDto } from "nestjs-zod";

export const suggestUrlsSchema = z.object({
  q: z
    .string()
    .min(1, "Le paramètre q est requis")
    .describe("Indice texte pour trouver des URLs e-commerce"),
});

export class SuggestUrlsDto extends createZodDto(suggestUrlsSchema) {}
