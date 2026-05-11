import { z } from "zod";

/** Valeurs alignées sur l'enum PostgreSQL `shop_cms`. */
export const shopCmsSchema = z.enum(["prestashop", "shopify", "woocommerce", "autre", "inconnu"]);
