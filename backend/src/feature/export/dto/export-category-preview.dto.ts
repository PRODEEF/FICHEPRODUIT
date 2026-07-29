import { createZodDto } from "nestjs-zod";
import { z } from "zod";

const categoryMatchKindSchema = z.enum(["exact", "token", "none"]);

export const exportCategoryPreviewPairSchema = z.object({
  sourceKey: z.string(),
  category: z.string(),
  subCategory: z.string().nullable(),
  manufacturerPath: z.string(),
  suggestedPath: z.string(),
  suggestedNodeId: z.string().nullable(),
  matchKind: categoryMatchKindSchema,
  productCount: z.number().int().nonnegative(),
});

export const exportCategoryTreeOptionSchema = z.object({
  id: z.string().uuid(),
  path: z.string(),
  depth: z.number().int().positive(),
});

export const exportCategoryPreviewResponseSchema = z.object({
  pairs: z.array(exportCategoryPreviewPairSchema),
  treeOptions: z.array(exportCategoryTreeOptionSchema),
});

export class ExportCategoryPreviewResponseDto extends createZodDto(
  exportCategoryPreviewResponseSchema,
) {}

export type ExportCategoryPreviewPair = z.infer<typeof exportCategoryPreviewPairSchema>;
export type ExportCategoryPreviewResponse = z.infer<typeof exportCategoryPreviewResponseSchema>;
