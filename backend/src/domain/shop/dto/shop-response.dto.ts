import { createZodDto } from "nestjs-zod";
import { z } from "zod";

import { shopCmsSchema } from "./shop-cms.schema";

export const shopResponseSchema = z.object({
  id: z.uuid().describe("Identifiant de la boutique"),
  name: z.string().describe("Nom affiché"),
  url: z.union([z.literal(""), z.url()]).describe("URL du site marchand (vide si non renseignée)"),
  cms: shopCmsSchema.describe("CMS détecté ou déclaré"),
  sector: z.string().nullable().describe("Secteur métier"),
  brands: z.array(z.string()).describe("Marques associées"),
  categories: z.array(z.string()).describe("Catégories détectées ou saisies"),
  ownerId: z
    .uuid()
    .nullable()
    .describe("Propriétaire (null pour une boutique invitée avant inscription)"),
  createdAt: z.string().describe("Création (ISO 8601)"),
  updatedAt: z.string().describe("Dernière mise à jour (ISO 8601)"),
});

export class ShopResponseDto extends createZodDto(shopResponseSchema) {}
