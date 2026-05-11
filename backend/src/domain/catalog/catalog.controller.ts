import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Req, UnauthorizedException, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import type { FastifyRequest } from "fastify";
import { CurrentUser } from "../../core/auth/decorators/current-user.decorator";
import { OptionalJwtGuard } from "../../core/auth/guards/optional-jwt.guard";
import { readGuestSessionId } from "../../core/http/guest-session";
import type { AuthenticatedUser } from "../../core/auth/types/jwt-payload.types";
import { CatalogService } from "./catalog.service";
import { CatalogByIdsDto } from "./dto/catalog-by-ids.dto";
import { CatalogProductResponseDto } from "./dto/catalog-product-response.dto";
import { CatalogSearchDto } from "./dto/catalog-search.dto";

@ApiTags("Catalogue")
@Controller("api/catalog/products")
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  /**
   * Declared before `GET :id` so the path segment `by-shop-brands` is not parsed as a product UUID.
   */
  @Get("by-shop-brands/:shopId")
  @UseGuards(OptionalJwtGuard)
  @ApiBearerAuth("bearerAuth")
  @ApiParam({
    name: "shopId",
    format: "uuid",
    description:
      "Identifiant UUID de la boutique ; les marques configurées (`shop.brands`) déterminent les produits retournés.",
  })
  @ApiOperation({
    summary: "Produits catalogue pour les marques d’une boutique",
    description:
      "Avec JWT : la boutique doit appartenir à l’utilisateur. Sans JWT : boutique invitée ; cookie de session invité requis (`session_id` aligné).",
  })
  @ApiOkResponse({ type: [CatalogProductResponseDto] })
  @ApiNotFoundResponse({ description: "Boutique introuvable ou non autorisée" })
  @ApiUnauthorizedResponse({ description: "JWT ou session invité manquant" })
  listByShopBrands(
    @Param("shopId", ParseUUIDPipe) shopId: string,
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Req() req: FastifyRequest,
  ): Promise<CatalogProductResponseDto[]> {
    if (user) {
      return this.catalogService.listCatalogProductsByShopBrands(shopId, user);
    }
    const sessionId = readGuestSessionId(req);
    if (!sessionId) {
      throw new UnauthorizedException("Guest session required");
    }
    return this.catalogService.listCatalogProductsByShopBrandsForGuest(shopId, sessionId);
  }

  @Get(":id")
  @UseGuards(OptionalJwtGuard)
  @ApiBearerAuth("bearerAuth")
  @ApiParam({
    name: "id",
    format: "uuid",
    description: "Identifiant UUID du produit catalogue.",
  })
  @ApiOperation({
    summary: "Détail d’un produit catalogue",
    description:
      "Lecture publique avec RLS Supabase ; un JWT peut être requis selon les politiques de la base (rôles `anon` / `authenticated`).",
  })
  @ApiOkResponse({ type: CatalogProductResponseDto })
  @ApiNotFoundResponse({ description: "Produit introuvable" })
  @ApiUnauthorizedResponse({ description: "JWT invalide" })
  getOne(@Param("id", ParseUUIDPipe) id: string): Promise<CatalogProductResponseDto> {
    return this.catalogService.getById(id);
  }

  @Post("search")
  @UseGuards(OptionalJwtGuard)
  @ApiBearerAuth("bearerAuth")
  @ApiOperation({
    summary: "Rechercher des produits catalogue par critères",
    description:
      "Filtres sur la table `catalog_products` (marques, secteur, catégories, années, prix, attributs JSON). Lorsque `brands` est renseigné, chaque marque est interrogée puis les résultats sont fusionnés (plafond global via `limit`).",
  })
  @ApiOkResponse({ type: [CatalogProductResponseDto] })
  @ApiBadRequestResponse({ description: "Body invalide (critères)" })
  @ApiUnauthorizedResponse({ description: "JWT invalide" })
  search(@Body() body: CatalogSearchDto): Promise<CatalogProductResponseDto[]> {
    return this.catalogService.search(body);
  }

  @Post("by-ids")
  @UseGuards(OptionalJwtGuard)
  @ApiBearerAuth("bearerAuth")
  @ApiOperation({
    summary: "Charger plusieurs produits par UUID",
    description:
      "Retourne uniquement les produits existants, dans l’ordre des identifiants fournis (les IDs inexistants sont omis).",
  })
  @ApiOkResponse({ type: [CatalogProductResponseDto] })
  @ApiBadRequestResponse({ description: "Body invalide (UUIDs)" })
  @ApiUnauthorizedResponse({ description: "JWT invalide" })
  findMany(@Body() body: CatalogByIdsDto): Promise<CatalogProductResponseDto[]> {
    return this.catalogService.findByIds(body.ids);
  }
}
