import { createZodDto } from "nestjs-zod";
import { z } from "zod";
import { billingPlanIdSchema } from "../billing-plan.schema";
import { shopSectorSchema } from "../../shop/dto/shop-sector.schema";

export const publicPricingPlanSchema = z.object({
  id: billingPlanIdSchema,
  name: z.string(),
  priceEur: z.number(),
  pricePerSheetEur: z.number().nullable(),
  priceSuffix: z.string().nullable(),
  creditsLabel: z.string(),
  multiplier: z.number(),
});

export const billingPlansQuerySchema = z.object({
  sector: shopSectorSchema.default("Glisse"),
});

export const billingPlansResponseSchema = z.object({
  sector: shopSectorSchema,
  multiplier: z.number(),
  plans: z.array(publicPricingPlanSchema),
});

export type PublicPricingPlan = z.infer<typeof publicPricingPlanSchema>;
export type PublicPricingPlansResponse = z.infer<typeof billingPlansResponseSchema>;

export class BillingPlansQueryDto extends createZodDto(billingPlansQuerySchema) {}
export class BillingPlansResponseDto extends createZodDto(billingPlansResponseSchema) {}
