import { createZodDto } from "nestjs-zod";
import { z } from "zod";

export const suggestUrlsResponseSchema = z.object({
  urls: z.array(z.string()).describe("URLs de boutiques suggérées"),
});

export class SuggestUrlsResponseDto extends createZodDto(suggestUrlsResponseSchema) {}
