import { z } from "zod";
import { createZodDto } from "nestjs-zod";
import { FIELD_TYPES } from "../types/product-template.types";

const fieldSchema = z.object({
  name: z.string().min(1).max(255).describe("Nom logique du champ"),
  type: z.enum(FIELD_TYPES).describe("Type métier du champ"),
  required: z.boolean().default(false).describe("Champ obligatoire dans l’export"),
});

export const createTemplateSchema = z.object({
  name: z.string().min(1).max(255).describe("Libellé du gabarit"),
  fields: z.array(fieldSchema).min(1).describe("Champs du gabarit (au moins un)"),
});

export class CreateTemplateDto extends createZodDto(createTemplateSchema) {}
