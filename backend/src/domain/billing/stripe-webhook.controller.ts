import { BadRequestException, Controller, Headers, Post, Req } from "@nestjs/common";
import { ApiExcludeController, ApiOperation, ApiTags } from "@nestjs/swagger";
import type { FastifyRequest } from "fastify";
import { StripeWebhookService } from "./stripe-webhook.service";

type FastifyRequestWithRawBody = FastifyRequest & { rawBody?: Buffer };

@ApiTags("Billing")
@ApiExcludeController()
@Controller("api/billing/stripe")
export class StripeWebhookController {
  constructor(private readonly webhookService: StripeWebhookService) {}

  @Post("webhook")
  @ApiOperation({
    summary: "Webhook Stripe",
    description: "Endpoint appelé par Stripe — vérification de signature, pas de JWT.",
  })
  async handleWebhook(
    @Req() req: FastifyRequestWithRawBody,
    @Headers("stripe-signature") signature: string | undefined,
  ): Promise<{ received: true }> {
    const rawBody = req.rawBody;
    if (!rawBody) {
      throw new BadRequestException("Corps brut Stripe manquant");
    }
    if (!signature) {
      throw new BadRequestException("En-tête stripe-signature manquant");
    }

    const event = this.webhookService.constructEvent(rawBody, signature);
    await this.webhookService.handleEvent(event);
    return { received: true };
  }
}
