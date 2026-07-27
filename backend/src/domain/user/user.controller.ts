import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  Res,
  BadRequestException,
  UseGuards,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import type { FastifyReply, FastifyRequest } from "fastify";
import { JwtGuard } from "../../core/auth/guards/jwt.guard";
import { CurrentUser } from "../../core/auth/decorators/current-user.decorator";
import {
  clearGuestSessionCookie,
  readGuestSessionCookie,
  resolveClaimGuestSessionId,
} from "../../core/http/guest-session";
import type { AuthenticatedUser } from "../../core/auth/types/jwt-payload.types";
import { ClaimGuestSessionDto } from "./dto/claim-guest-session.dto";
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
    summary: "Profil de l’utilisateur connecté",
    description:
      "Crée une ligne `public.users` si elle n’existe pas encore (première visite après inscription).",
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
      "Session invité via cookie httpOnly, body `sessionId` ou en-tête `x-session-id` (doit correspondre au cookie si les deux sont présents).",
  })
  @ApiCreatedResponse({ type: UserMeResponseDto })
  @ApiUnauthorizedResponse({ description: "JWT manquant ou invalide" })
  @ApiBadRequestResponse({
    description: "Session invité introuvable ou sessionId body ne correspond pas au cookie",
  })
  async claimGuestSession(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: ClaimGuestSessionDto,
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    const sid = resolveClaimGuestSessionId(req, body.sessionId);
    if (!sid) {
      const bodySid = body.sessionId?.trim();
      if (bodySid && readGuestSessionCookie(req)) {
        throw new BadRequestException("Le sessionId ne correspond pas au cookie invité");
      }
      throw new BadRequestException(
        "Session invité requise (cookie, en-tête x-session-id ou body sessionId)",
      );
    }
    const result = await this.userService.claimGuestSession(user, sid);
    const secure = this.config.get<string>("nodeEnv") === "production";
    clearGuestSessionCookie(reply, secure);
    return result;
  }
}
