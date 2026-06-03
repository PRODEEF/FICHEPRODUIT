import { createZodDto } from "nestjs-zod";
import { z } from "zod";

import { shopCmsSchema } from "./shop-cms.schema";
import { shopSectorSchema } from "./shop-sector.schema";

export const updateShopSchema = z.object({
  name: z.string().min(1).max(255).optional().describe("Nom affiché"),
  url: z
    .union([z.literal(""), z.url()])
    .optional()
    .describe("URL du site (chaîne vide si non renseignée)"),
  cms: shopCmsSchema.optional().describe("CMS"),
  sector: shopSectorSchema.nullable().optional().describe("Secteur métier"),
  brands: z.array(z.string().min(1)).optional().describe("Marques"),
  categories: z.array(z.string().min(1)).optional().describe("Catégories"),
});

export class UpdateShopDto extends createZodDto(updateShopSchema) {}
