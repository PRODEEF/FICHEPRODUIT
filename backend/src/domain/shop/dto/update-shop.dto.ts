import { createZodDto } from "nestjs-zod";
import { z } from "zod";

import { shopCmsSchema } from "./shop-cms.schema";

export const updateShopSchema = z.object({
  name: z.string().min(1).max(255).optional().describe("Nom affiché"),
  url: z.url().optional().describe("URL du site"),
  cms: shopCmsSchema.optional().describe("CMS"),
  sector: z.string().max(255).nullable().optional().describe("Secteur métier"),
  brands: z.array(z.string().min(1)).optional().describe("Marques"),
  categories: z.array(z.string().min(1)).optional().describe("Catégories"),
});

export class UpdateShopDto extends createZodDto(updateShopSchema) {}
