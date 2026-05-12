import { z } from "zod";
import { createZodDto } from "nestjs-zod";

export const scrapeFieldsSchema = z.object({
  url: z.url("URL invalide").describe("URL absolue d’une page produit à analyser"),
});

export class ScrapeFieldsDto extends createZodDto(scrapeFieldsSchema) {}
