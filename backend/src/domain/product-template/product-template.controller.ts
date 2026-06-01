import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from "@nestjs/common";
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
import { JwtGuard } from "../../core/auth/guards/jwt.guard";
import { CurrentUser } from "../../core/auth/decorators/current-user.decorator";
import type { AuthenticatedUser } from "../../core/auth/types/jwt-payload.types";
import { ProductTemplateService } from "./product-template.service";
import { CreateTemplateDto } from "./dto/create-template.dto";
import { UpdateTemplateDto } from "./dto/update-template.dto";
import { ScrapeFieldsDto } from "./dto/scrape-fields.dto";
import { RefineFieldsDto } from "./dto/refine-fields.dto";
import {
  ProductTemplateResponseDto,
  ScrapeFieldsResultDto,
  RefineFieldsResultDto,
} from "./dto/product-template-response.dto";

@ApiTags("Product templates")
@ApiBearerAuth("bearerAuth")
@UseGuards(JwtGuard)
@Controller("api/shops/:shopId/templates")
export class ProductTemplateController {
  constructor(private readonly service: ProductTemplateService) {}

  @Get()
  @ApiOperation({ summary: "Lister les templates d'un shop" })
  @ApiParam({ name: "shopId", description: "UUID de la boutique", format: "uuid" })
  @ApiOkResponse({
    description: "Liste des gabarits du shop",
    type: [ProductTemplateResponseDto],
  })
  @ApiBadRequestResponse({ description: "shopId n’est pas un UUID valide" })
  @ApiUnauthorizedResponse({ description: "JWT manquant ou invalide" })
  listForShop(
    @Param("shopId", ParseUUIDPipe) shopId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.listForShop(shopId, user);
  }

  @Post("scrape-fields")
  @ApiOperation({ summary: "Détecter les champs depuis une URL produit" })
  @ApiParam({ name: "shopId", description: "UUID de la boutique", format: "uuid" })
  @ApiOkResponse({ description: "Champs détectés et avertissements", type: ScrapeFieldsResultDto })
  @ApiBadRequestResponse({ description: "URL invalide ou corps JSON invalide" })
  @ApiUnauthorizedResponse({ description: "JWT manquant ou invalide" })
  @ApiNotFoundResponse({ description: "Boutique introuvable" })
  scrapeFields(
    @Param("shopId", ParseUUIDPipe) shopId: string,
    @Body() body: ScrapeFieldsDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.scrapeFromUrl(shopId, user, body.url);
  }

  @Post("refine-fields")
  @ApiOperation({ summary: "Affiner les champs avec l'IA" })
  @ApiParam({ name: "shopId", description: "UUID de la boutique", format: "uuid" })
  @ApiOkResponse({ description: "Champs après raffinement", type: RefineFieldsResultDto })
  @ApiBadRequestResponse({ description: "Corps JSON invalide (Zod)" })
  @ApiUnauthorizedResponse({ description: "JWT manquant ou invalide" })
  @ApiNotFoundResponse({ description: "Boutique introuvable" })
  refineFields(
    @Param("shopId", ParseUUIDPipe) shopId: string,
    @Body() body: RefineFieldsDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.refineWithAi(shopId, user, body.fields, body.source, body.sampleValues);
  }

  @Get(":id")
  @ApiOperation({ summary: "Récupérer un template" })
  @ApiParam({ name: "shopId", description: "UUID de la boutique", format: "uuid" })
  @ApiParam({ name: "id", description: "UUID du gabarit", format: "uuid" })
  @ApiOkResponse({ description: "Gabarit trouvé", type: ProductTemplateResponseDto })
  @ApiNotFoundResponse({ description: "Template introuvable" })
  @ApiBadRequestResponse({ description: "Paramètre d’URL UUID invalide" })
  @ApiUnauthorizedResponse({ description: "JWT manquant ou invalide" })
  getOne(
    @Param("shopId", ParseUUIDPipe) shopId: string,
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.getOneInShop(shopId, id, user);
  }

  @Post()
  @ApiOperation({ summary: "Créer un template" })
  @ApiParam({ name: "shopId", description: "UUID de la boutique", format: "uuid" })
  @ApiCreatedResponse({ description: "Template créé", type: ProductTemplateResponseDto })
  @ApiBadRequestResponse({ description: "Corps JSON invalide (Zod)" })
  @ApiUnauthorizedResponse({ description: "JWT manquant ou invalide" })
  create(
    @Param("shopId", ParseUUIDPipe) shopId: string,
    @Body() body: CreateTemplateDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.create({ ...body, shopId }, user);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Modifier un template" })
  @ApiParam({ name: "shopId", description: "UUID de la boutique", format: "uuid" })
  @ApiParam({ name: "id", description: "UUID du gabarit", format: "uuid" })
  @ApiOkResponse({ description: "Gabarit mis à jour", type: ProductTemplateResponseDto })
  @ApiNotFoundResponse({ description: "Template introuvable" })
  @ApiBadRequestResponse({ description: "Corps JSON invalide ou UUID invalide" })
  @ApiUnauthorizedResponse({ description: "JWT manquant ou invalide" })
  update(
    @Param("shopId", ParseUUIDPipe) shopId: string,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: UpdateTemplateDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.updateInShop(shopId, id, body, user);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Supprimer un template" })
  @ApiParam({ name: "shopId", description: "UUID de la boutique", format: "uuid" })
  @ApiParam({ name: "id", description: "UUID du gabarit", format: "uuid" })
  @ApiOkResponse({ description: "Suppression effectuée (corps vide)" })
  @ApiNotFoundResponse({ description: "Template introuvable" })
  @ApiBadRequestResponse({ description: "UUID invalide" })
  @ApiUnauthorizedResponse({ description: "JWT manquant ou invalide" })
  remove(
    @Param("shopId", ParseUUIDPipe) shopId: string,
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.deleteInShop(shopId, id, user);
  }
}
