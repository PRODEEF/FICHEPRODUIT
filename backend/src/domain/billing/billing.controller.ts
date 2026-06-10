import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { JwtGuard } from "../../core/auth/guards/jwt.guard";
import { CurrentUser } from "../../core/auth/decorators/current-user.decorator";
import type { AuthenticatedUser } from "../../core/auth/types/jwt-payload.types";
import { BillingService } from "./billing.service";
import { BillingPlansQueryDto, BillingPlansResponseDto } from "./dto/billing-plans-response.dto";
import { BillingSummaryResponseDto } from "./dto/billing-summary-response.dto";
import { CheckoutResponseDto, CreateCheckoutDto } from "./dto/create-checkout.dto";

@ApiTags("Billing")
@Controller("api/billing")
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get("plans")
  @ApiOperation({
    summary: "Forfaits et tarifs par secteur",
    description:
      "Retourne les prix HT calculés côté serveur pour le secteur demandé. Endpoint public.",
  })
  @ApiOkResponse({ type: BillingPlansResponseDto })
  getPlans(@Query() query: BillingPlansQueryDto) {
    return this.billingService.getPlans(query.sector);
  }

  @Get("me")
  @UseGuards(JwtGuard)
  @ApiBearerAuth("bearerAuth")
  @ApiOperation({
    summary: "Résumé facturation de l'utilisateur connecté",
    description:
      "Solde crédits, abonnement, avantages actifs et historique récent. Accorde les 3 crédits d'inscription si besoin.",
  })
  @ApiOkResponse({ type: BillingSummaryResponseDto })
  @ApiUnauthorizedResponse({ description: "JWT manquant ou invalide" })
  getMe(@CurrentUser() user: AuthenticatedUser) {
    return this.billingService.getMe(user);
  }

  @Post("checkout")
  @UseGuards(JwtGuard)
  @ApiBearerAuth("bearerAuth")
  @ApiOperation({
    summary: "Créer une session Stripe Checkout",
    description: "Retourne l'URL de paiement Stripe pour le forfait et le secteur demandés.",
  })
  @ApiOkResponse({ type: CheckoutResponseDto })
  @ApiUnauthorizedResponse({ description: "JWT manquant ou invalide" })
  @ApiServiceUnavailableResponse({ description: "Stripe non configuré sur ce serveur" })
  createCheckout(@CurrentUser() user: AuthenticatedUser, @Body() body: CreateCheckoutDto) {
    return this.billingService.createCheckoutSession(user, body.planId, body.sector);
  }
}
