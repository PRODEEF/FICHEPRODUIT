import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import type { FastifyReply, FastifyRequest } from "fastify";
import { OptionalJwtGuard } from "../../core/auth/guards/optional-jwt.guard";
import { JwtGuard } from "../../core/auth/guards/jwt.guard";
import { CurrentUser } from "../../core/auth/decorators/current-user.decorator";
import { readGuestSessionId, setGuestSessionCookie } from "../../core/http/guest-session";
import type { AuthenticatedUser } from "../../core/auth/types/jwt-payload.types";
import { AnalysisService } from "./analysis.service";
import { AnalysisResponseDto } from "./dto/analysis-response.dto";
import { CreateAnalysisDto } from "./dto/create-analysis.dto";

@ApiTags("Analyses")
@Controller("api/analyses")
export class AnalysisController {
  constructor(
    private readonly service: AnalysisService,
    private readonly config: ConfigService,
  ) {}

  @Post()
  @UseGuards(OptionalJwtGuard)
  @ApiBearerAuth("bearerAuth")
  @ApiOperation({
    summary: "Lancer une analyse de site",
    description:
      "Avec JWT : l'analyse est rattachée à l'utilisateur. Sans JWT : parcours invité ; cookie `ficheproduct_guest_session` posé en httpOnly.",
  })
  @ApiCreatedResponse({
    description: "Analyse créée (statut initial pending)",
    type: AnalysisResponseDto,
  })
  @ApiBadRequestResponse({ description: "Corps JSON invalide (validation Zod)" })
  async create(
    @Body() body: CreateAnalysisDto,
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    if (user) {
      return this.service.create(body.url, user);
    }
    const sid = readGuestSessionId(req) ?? crypto.randomUUID();
    const analysis = await this.service.createForGuest(body.url, sid);
    const secure = this.config.get<string>("nodeEnv") === "production";
    const maxAge = this.config.get<number>("guestSessionCookieMaxAgeSec", 60 * 60 * 24 * 30);
    setGuestSessionCookie(reply, sid, { maxAgeSec: maxAge, secure });
    return analysis;
  }

  @Get()
  @UseGuards(JwtGuard)
  @ApiBearerAuth("bearerAuth")
  @ApiOperation({ summary: "Lister les analyses de l'utilisateur connecté" })
  @ApiOkResponse({
    description: "Liste des analyses du compte, du plus récent au plus ancien",
    type: [AnalysisResponseDto],
  })
  @ApiUnauthorizedResponse({ description: "JWT manquant ou invalide" })
  listForUser(@CurrentUser() user: AuthenticatedUser) {
    return this.service.listForUser(user);
  }

  @Get(":id")
  @UseGuards(OptionalJwtGuard)
  @ApiBearerAuth("bearerAuth")
  @ApiOperation({
    summary: "Récupérer une analyse par identifiant",
    description:
      "Avec JWT : accès si l'analyse appartient à l'utilisateur. Sans JWT : cookie invité `ficheproduct_guest_session` aligné sur `analyses.session_id`.",
  })
  @ApiParam({ name: "id", description: "UUID de l'analyse", format: "uuid" })
  @ApiOkResponse({ description: "Analyse trouvée", type: AnalysisResponseDto })
  @ApiBadRequestResponse({ description: "id n'est pas un UUID valide" })
  @ApiUnauthorizedResponse({
    description: "Parcours invité sans cookie de session",
  })
  @ApiNotFoundResponse({ description: "Analyse introuvable ou non autorisée" })
  getOne(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Req() req: FastifyRequest,
  ) {
    if (user) return this.service.getForUser(id, user);
    const sessionId = readGuestSessionId(req);
    if (!sessionId) {
      throw new UnauthorizedException("Session invitée manquante. Relance l'analyse.");
    }
    return this.service.getForGuest(id, sessionId);
  }
}
