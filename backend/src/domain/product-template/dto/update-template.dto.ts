import { createZodDto } from "nestjs-zod";
import { assertUniqueFieldNames } from "../lib/validate-template-fields";
import { templateBaseSchema } from "./create-template.dto";

export const updateTemplateSchema = templateBaseSchema.partial().superRefine((data, ctx) => {
  if (data.fields !== undefined) {
    assertUniqueFieldNames(data.fields, ctx);
  }
});

export class UpdateTemplateDto extends createZodDto(updateTemplateSchema) {}
