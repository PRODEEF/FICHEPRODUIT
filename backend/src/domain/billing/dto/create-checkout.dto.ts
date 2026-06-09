import { createZodDto } from "nestjs-zod";
import { z } from "zod";
import { checkoutPlanIdSchema } from "../billing-plan.schema";
import { shopSectorSchema } from "../../shop/dto/shop-sector.schema";

export { billingPlanIdSchema, checkoutPlanIdSchema } from "../billing-plan.schema";
export type { CheckoutPlanId } from "../billing-plan.schema";

export const createCheckoutSchema = z.object({
  planId: checkoutPlanIdSchema.describe("Identifiant du forfait choisi"),
  sector: shopSectorSchema.describe("Secteur boutique au moment de l'achat"),
});

export class CreateCheckoutDto extends createZodDto(createCheckoutSchema) {}

export const checkoutResponseSchema = z.object({
  url: z.url().describe("URL Stripe Checkout pour rediriger l'utilisateur"),
});

export class CheckoutResponseDto extends createZodDto(checkoutResponseSchema) {}
