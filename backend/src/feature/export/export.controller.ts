import { Body, Controller, Get, HttpCode, Post, Query, Res, UseGuards } from "@nestjs/common";
import { FastifyReply } from "fastify";
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiProduces,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { EmailVerifiedGuard } from "../../core/auth/guards/email-verified.guard";
import { JwtGuard } from "../../core/auth/guards/jwt.guard";
import { CurrentUser } from "../../core/auth/decorators/current-user.decorator";
import type { AuthenticatedUser } from "../../core/auth/types/jwt-payload.types";
import { ExportCategoryPreviewResponseDto } from "./dto/export-category-preview.dto";
import {
  ExportCategoryPreviewBodyDto,
  ExportCategoryPreviewQueryDto,
  ExportPrestashopBodyDto,
  ExportPrestashopQueryDto,
} from "./dto/export-prestashop-query.dto";
import { PrestashopExportService } from "./prestashop/prestashop-export.service";

/**
 * Export catalogue → CSV PrestaShop 8 (products / combinations).
 */
@ApiTags("Export")
@ApiBearerAuth("bearerAuth")
@ApiForbiddenResponse({ description: "E-mail non confirmé" })
@UseGuards(JwtGuard, EmailVerifiedGuard)
@Controller("api/export")
export class ExportController {
  constructor(private readonly prestashopExportService: PrestashopExportService) {}

  @Get("prestashop/category-preview")
  @HttpCode(200)
  @ApiOperation({
    summary: "Prévisualiser le matching des catégories avant export",
    description:
      "Retourne les paires (catégorie fabricant → chemin magasin suggéré) " +
      "et les options de l’arbre pour validation manuelle.",
  })
  @ApiOkResponse({ type: ExportCategoryPreviewResponseDto })
  @ApiBadRequestResponse({ description: "Query invalide" })
  @ApiUnauthorizedResponse({ description: "JWT manquant ou invalide" })
  @ApiNotFoundResponse({
    description: "Boutique inaccessible ou aucun produit pour les IDs donnés",
  })
  async previewCategories(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ExportCategoryPreviewQueryDto,
  ): Promise<ExportCategoryPreviewResponseDto> {
    return this.previewCategoriesFromRequest(
      { shopId: query.shopId, productIds: query.productIds },
      user,
    );
  }

  @Post("prestashop/category-preview")
  @HttpCode(200)
  @ApiOperation({
    summary: "Prévisualiser le matching des catégories (corps JSON)",
    description:
      "Même réponse que le GET, mais les `productIds` sont dans le corps pour les sélections volumineuses.",
  })
  @ApiOkResponse({ type: ExportCategoryPreviewResponseDto })
  @ApiBadRequestResponse({ description: "Body invalide" })
  @ApiUnauthorizedResponse({ description: "JWT manquant ou invalide" })
  @ApiNotFoundResponse({
    description: "Boutique inaccessible ou aucun produit pour les IDs donnés",
  })
  async previewCategoriesPost(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: ExportCategoryPreviewBodyDto,
  ): Promise<ExportCategoryPreviewResponseDto> {
    return this.previewCategoriesFromRequest(
      { shopId: body.shopId, productIds: body.productIds },
      user,
    );
  }

  private previewCategoriesFromRequest(
    req: { shopId: string; productIds: string[] },
    user: AuthenticatedUser,
  ): Promise<ExportCategoryPreviewResponseDto> {
    return this.prestashopExportService.previewCategories(req, user);
  }

  @Get("prestashop")
  @HttpCode(200)
  @ApiOperation({
    summary: "Exporter des produits au format CSV PrestaShop 8",
    description:
      "Génère `products.csv` ou `combinations.csv` (séparateur `;`, UTF-8 BOM) " +
      "importables via Paramètres avancés → Importer. Pas de débit de crédits. " +
      "Les déclinaisons sont dérivées des attributs `taille`/`couleur`. " +
      "Overrides catégories optionnels via `categoryOverrides` (JSON).",
  })
  @ApiQuery({ name: "type", enum: ["products", "combinations"], required: true })
  @ApiQuery({ name: "shopId", type: String, required: true })
  @ApiQuery({
    name: "productIds",
    type: String,
    required: true,
    description: "UUID séparés par des virgules",
  })
  @ApiQuery({
    name: "categoryOverrides",
    type: String,
    required: false,
    description:
      'JSON optionnel : [{"sourceKey":"kitesurf|ailes kitesurf","targetNodeId":"<uuid>|""}]',
  })
  @ApiProduces("text/csv")
  @ApiOkResponse({
    description: "Fichier CSV en pièce jointe (`Content-Disposition`).",
    schema: { type: "string", format: "binary" },
  })
  @ApiBadRequestResponse({
    description: "Query invalide, référence manquante ou dupliquée",
  })
  @ApiUnauthorizedResponse({ description: "JWT manquant ou invalide" })
  @ApiNotFoundResponse({
    description: "Boutique inaccessible ou aucun produit pour les IDs donnés",
  })
  async exportPrestashop(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ExportPrestashopQueryDto,
    @Res() reply: FastifyReply,
  ): Promise<void> {
    await this.sendPrestashopExport(
      {
        type: query.type,
        shopId: query.shopId,
        productIds: query.productIds,
        categoryOverrides: query.categoryOverrides,
      },
      user,
      reply,
    );
  }

  @Post("prestashop")
  @HttpCode(200)
  @ApiOperation({
    summary: "Exporter des produits au format CSV PrestaShop 8 (corps JSON)",
    description:
      "Même réponse que le GET, mais les `productIds` sont dans le corps pour les sélections volumineuses.",
  })
  @ApiProduces("text/csv")
  @ApiOkResponse({
    description: "Fichier CSV en pièce jointe (`Content-Disposition`).",
    schema: { type: "string", format: "binary" },
  })
  @ApiBadRequestResponse({
    description: "Body invalide, référence manquante ou dupliquée",
  })
  @ApiUnauthorizedResponse({ description: "JWT manquant ou invalide" })
  @ApiNotFoundResponse({
    description: "Boutique inaccessible ou aucun produit pour les IDs donnés",
  })
  async exportPrestashopPost(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: ExportPrestashopBodyDto,
    @Res() reply: FastifyReply,
  ): Promise<void> {
    await this.sendPrestashopExport(
      {
        type: body.type,
        shopId: body.shopId,
        productIds: body.productIds,
        categoryOverrides: body.categoryOverrides,
      },
      user,
      reply,
    );
  }

  private async sendPrestashopExport(
    req: {
      type: "products" | "combinations";
      shopId: string;
      productIds: string[];
      categoryOverrides?: { sourceKey: string; targetNodeId: string }[];
    },
    user: AuthenticatedUser,
    reply: FastifyReply,
  ): Promise<void> {
    const result = await this.prestashopExportService.export(req, user);

    reply
      .header("Content-Type", "text/csv; charset=utf-8")
      .header("Content-Disposition", `attachment; filename="${result.filename}"`)
      .send(result.stream);
  }
}
