import {
  BadRequestException,
  Body,
  Controller,
  Get,
  ParseUUIDPipe,
  Patch,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import type { FastifyRequest } from "fastify";
import { EmailVerifiedGuard } from "../../core/auth/guards/email-verified.guard";
import { JwtGuard } from "../../core/auth/guards/jwt.guard";
import { OptionalJwtGuard } from "../../core/auth/guards/optional-jwt.guard";
import { CurrentUser } from "../../core/auth/decorators/current-user.decorator";
import { readGuestSessionId } from "../../core/http/guest-session";
import type { AuthenticatedUser } from "../../core/auth/types/jwt-payload.types";
import { ShopResponseDto } from "./dto/shop-response.dto";
import { UpdateShopDto } from "./dto/update-shop.dto";
import { ShopService } from "./shop.service";

@ApiTags("Shop")
@Controller(["api/shop", "api/shops"])
export class ShopController {
  constructor(private readonly shopService: ShopService) {}

  @Get()
  @UseGuards(OptionalJwtGuard)
  @ApiBearerAuth("bearerAuth")
  @ApiOperation({
    summary: "Récupérer le magasin",
    description:
      "Avec JWT : le magasin du compte (une fiche minimale est créée si l’utilisateur n’en a pas encore). Sans JWT : boutique invitée ; cookie de session invité requis et paramètre query `shopId` (UUID de la boutique liée à l’analyse).",
  })
  @ApiOkResponse({ description: "Détail du magasin", type: ShopResponseDto })
  @ApiNotFoundResponse({ description: "Aucun magasin ou boutique introuvable pour cette session" })
  @ApiUnauthorizedResponse({ description: "Parcours invité sans session (cookie manquant)" })
  @ApiBadRequestResponse({ description: "Parcours invité sans query shopId" })
  async getShop(
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Query("shopId", new ParseUUIDPipe({ optional: true })) shopId: string | undefined,
    @Req() req: FastifyRequest,
  ) {
    if (user) {
      return this.shopService.getMyShop(user.id, user.accessToken);
    }
    if (!shopId) {
      throw new BadRequestException("Le paramètre shopId est requis pour l'accès invité");
    }
    const sessionId = readGuestSessionId(req);
    if (!sessionId) {
      throw new UnauthorizedException("Session invité requise");
    }
    return this.shopService.getForGuest(shopId, sessionId);
  }

  @Patch()
  @UseGuards(JwtGuard, EmailVerifiedGuard)
  @ApiBearerAuth("bearerAuth")
  @ApiOperation({ summary: "Mettre à jour le magasin de l'utilisateur connecté" })
  @ApiOkResponse({ description: "Magasin mis à jour", type: ShopResponseDto })
  @ApiNotFoundResponse({ description: "Aucun magasin enregistré pour cet utilisateur" })
  @ApiUnauthorizedResponse({ description: "Jeton manquant ou invalide" })
  @ApiForbiddenResponse({ description: "E-mail non confirmé" })
  patch(@CurrentUser() user: AuthenticatedUser, @Body() body: UpdateShopDto) {
    return this.shopService.updateMyShop(user.id, body, user.accessToken);
  }
}
