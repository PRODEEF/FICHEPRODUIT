import { createZodDto } from "nestjs-zod";
import { z } from "zod";
import { shopSectorSchema } from "../../shop/dto/shop-sector.schema";

export const billingPlanIdSchema = z.enum([
  "starter",
  "pro",
  "business_silver",
  "business_gold",
  "platinum",
]);

export const createCheckoutSchema = z.object({
  planId: billingPlanIdSchema.describe("Identifiant du forfait choisi"),
  sector: shopSectorSchema.describe("Secteur boutique au moment de l'achat"),
});

export class CreateCheckoutDto extends createZodDto(createCheckoutSchema) {}

export const checkoutResponseSchema = z.object({
  url: z.url().describe("URL Stripe Checkout pour rediriger l'utilisateur"),
});

export class CheckoutResponseDto extends createZodDto(checkoutResponseSchema) {}
