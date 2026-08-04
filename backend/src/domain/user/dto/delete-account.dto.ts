import { createZodDto } from "nestjs-zod";
import { z } from "zod";

export const deleteAccountSchema = z.object({
  password: z
    .string()
    .min(1, "Indiquez votre mot de passe.")
    .describe("Mot de passe actuel du compte, requis pour confirmer la suppression."),
});

export class DeleteAccountDto extends createZodDto(deleteAccountSchema) {}
