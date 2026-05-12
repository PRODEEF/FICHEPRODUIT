import { createZodDto } from "nestjs-zod";
import { createTemplateSchema } from "./create-template.dto";

export const updateTemplateSchema = createTemplateSchema.partial();
export class UpdateTemplateDto extends createZodDto(updateTemplateSchema) {}
