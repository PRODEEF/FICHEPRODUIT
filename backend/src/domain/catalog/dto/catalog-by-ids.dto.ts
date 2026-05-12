import { createZodDto } from "nestjs-zod";
import { z } from "zod";

export const catalogByIdsSchema = z.object({
  ids: z.array(z.uuid()).min(1).max(500).describe("Liste des UUID produits catalogue à charger"),
});

export class CatalogByIdsDto extends createZodDto(catalogByIdsSchema) {}
