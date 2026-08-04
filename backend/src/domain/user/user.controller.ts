import {
  Controller,
  Delete,
  Get,
  HttpCode,
  Patch,
  Post,
  Req,
  Res,
  BadRequestException,
  UseGuards,
  Body,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import type { FastifyReply, FastifyRequest } from "fastify";
import { JwtGuard } from "../../core/auth/guards/jwt.guard";
import { CurrentUser } from "../../core/auth/decorators/current-user.decorator";
import { clearGuestSessionCookie, resolveClaimGuestSessionId } from "../../core/http/guest-session";
import type { AuthenticatedUser } from "../../core/auth/types/jwt-payload.types";
import { DeleteAccountDto } from "./dto/delete-account.dto";
import { UpdateUserProfileDto } from "./dto/update-user-profile.dto";
import { UserMeResponseDto } from "./dto/user-response.dto";
import { UserService } from "./user.service";

@ApiTags("Utilisateurs")
@Controller("api/users")
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly config: ConfigService,
  ) {}

  @Get("me")
  @UseGuards(JwtGuard)
  @ApiBearerAuth("bearerAuth")
  @ApiOperation({
    summary: "Profil de l'utilisateur connecté",
    description:
      "Crée une ligne `public.users` si elle n'existe pas encore (première visite après inscription).",
  })
  @ApiOkResponse({ type: UserMeResponseDto })
  @ApiUnauthorizedResponse({ description: "JWT manquant ou invalide" })
  getMe(@CurrentUser() user: AuthenticatedUser) {
    return this.userService.getMe(user);
  }

  @Patch("me")
  @UseGuards(JwtGuard)
  @ApiBearerAuth("bearerAuth")
  @ApiOperation({ summary: "Mettre à jour le profil" })
  @ApiOkResponse({ type: UserMeResponseDto })
  @ApiUnauthorizedResponse({ description: "JWT manquant ou invalide" })
  updateMe(@CurrentUser() user: AuthenticatedUser, @Body() body: UpdateUserProfileDto) {
    return this.userService.updateMe(user, body);
  }

  @Post("me/claim-guest-session")
  @UseGuards(JwtGuard)
  @ApiBearerAuth("bearerAuth")
  @ApiOperation({
    summary: "Rattacher les analyses invitées à ce compte",
    description:
      "Met à jour les analyses dont `session_id` correspond : elles passent sous `user_id` du porteur du JWT. " +
      "La session invité est lue exclusivement depuis le cookie httpOnly `ficheproduct_guest_session`.",
  })
  @ApiCreatedResponse({ type: UserMeResponseDto })
  @ApiUnauthorizedResponse({ description: "JWT manquant ou invalide" })
  @ApiBadRequestResponse({
    description: "Cookie de session invité absent ou invalide",
  })
  async claimGuestSession(
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    const sid = resolveClaimGuestSessionId(req);
    if (!sid) {
      throw new BadRequestException(
        "Session invité introuvable : cookie httpOnly `ficheproduct_guest_session` requis",
      );
    }
    const result = await this.userService.claimGuestSession(user, sid);
    const secure = this.config.get<string>("nodeEnv") === "production";
    clearGuestSessionCookie(reply, secure);
    return result;
  }

  @Delete("me")
  @HttpCode(204)
  @UseGuards(JwtGuard)
  @ApiBearerAuth("bearerAuth")
  @ApiOperation({
    summary: "Supprimer définitivement le compte connecté",
    description:
      "Suppression conforme RGPD art. 17 : annulation de l'abonnement Stripe, archivage " +
      "sans PII des factures, anonymisation du client Stripe, purge du journal de crédits " +
      "et suppression du compte Supabase Auth (cascade sur les tables reliées). " +
      "Le mot de passe courant est requis pour confirmer l'action.",
  })
  @ApiNoContentResponse({ description: "Compte supprimé" })
  @ApiBadRequestResponse({ description: "Corps invalide (validation Zod)" })
  @ApiUnauthorizedResponse({ description: "JWT manquant ou mot de passe incorrect" })
  async deleteMe(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: DeleteAccountDto,
  ): Promise<void> {
    await this.userService.deleteMe(user, body.password);
  }
}
