import { z } from "zod";
import { createZodDto } from "nestjs-zod";

export const exportProductsSchema = z.object({
  productIds: z
    .array(z.uuid())
    .min(1, "Sélectionne au moins un produit")
    .describe("Liste des UUID produits catalogue à inclure dans le CSV"),
  templateId: z.uuid().describe("UUID du gabarit (template) à utiliser pour les colonnes"),
  shopId: z.uuid().describe("UUID de la boutique propriétaire du template (contrôle d’accès)"),
});

export class ExportProductsDto extends createZodDto(exportProductsSchema) {}
