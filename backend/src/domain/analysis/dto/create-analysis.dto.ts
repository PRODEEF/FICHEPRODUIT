import { createZodDto } from "nestjs-zod";
import { z } from "zod";

export const createAnalysisSchema = z.object({
  url: z.url("URL invalide").describe("URL du site e-commerce à analyser"),
});

export class CreateAnalysisDto extends createZodDto(createAnalysisSchema) {}
