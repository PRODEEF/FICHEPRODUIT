import { Body, Controller, Get, HttpCode, Post, Query, Res, UseGuards } from "@nestjs/common";
import { FastifyReply } from "fastify";
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiProduces,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { INSUFFICIENT_CREDITS_ERROR } from "../../domain/billing/exceptions/insufficient-credits.exception";
import { JwtGuard } from "../../core/auth/guards/jwt.guard";
import { CurrentUser } from "../../core/auth/decorators/current-user.decorator";
import type { AuthenticatedUser } from "../../core/auth/types/jwt-payload.types";
import { ExportService } from "./export.service";
import { ExportProductsDto } from "./dto/export-products.dto";
import { ExportPrestashopQueryDto } from "./dto/export-prestashop-query.dto";
import { PrestashopExportService } from "./prestashop/prestashop-export.service";

/**
 * Export catalogue → CSV (colonnes catalogue standards + format PrestaShop 8).
 */
@ApiTags("Export")
@ApiBearerAuth("bearerAuth")
@UseGuards(JwtGuard)
@Controller("api/export")
export class ExportController {
  constructor(
    private readonly exportService: ExportService,
    private readonly prestashopExportService: PrestashopExportService,
  ) {}

  @Post()
  @HttpCode(200)
  @ApiOperation({
    summary: "Exporter des produits en CSV",
    description:
      "Vérifie l’accès à la boutique (`shopId`), mappe les champs catalogue standards, " +
      "complète le reste via l’IA si nécessaire, puis renvoie un fichier CSV en pièce jointe.",
  })
  @ApiBody({ type: ExportProductsDto })
  @ApiProduces("text/csv")
  @ApiOkResponse({
    description:
      "Corps brut du fichier CSV (`text/csv`). Le nom du fichier est dans `Content-Disposition`.",
    schema: { type: "string", format: "binary" },
  })
  @ApiBadRequestResponse({
    description: "Corps JSON invalide (UUIDs, tableau productIds non vide)",
  })
  @ApiUnauthorizedResponse({ description: "JWT manquant ou invalide" })
  @ApiNotFoundResponse({
    description: "Boutique inaccessible ou aucun produit pour les IDs donnés",
  })
  @ApiResponse({
    status: 402,
    description: `Crédits insuffisants — code métier \`${INSUFFICIENT_CREDITS_ERROR}\``,
  })
  async exportCsv(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: ExportProductsDto,
    @Res() reply: FastifyReply,
  ): Promise<void> {
    const result = await this.exportService.export(body, user);

    reply
      .header("Content-Type", "text/csv; charset=utf-8")
      .header("Content-Disposition", `attachment; filename="${result.filename}"`)
      .send(result.csv);
  }

  @Get("prestashop")
  @HttpCode(200)
  @ApiOperation({
    summary: "Exporter des produits au format CSV PrestaShop 8",
    description:
      "Génère `products.csv` ou `combinations.csv` (séparateur `;`, UTF-8 BOM) " +
      "importables via Paramètres avancés → Importer. Pas de débit de crédits. " +
      "Les déclinaisons sont dérivées des attributs `taille`/`couleur`.",
  })
  @ApiQuery({ name: "type", enum: ["products", "combinations"], required: true })
  @ApiQuery({ name: "shopId", type: String, required: true })
  @ApiQuery({
    name: "productIds",
    type: String,
    required: true,
    description: "UUID séparés par des virgules",
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
    const result = await this.prestashopExportService.export(
      {
        type: query.type,
        shopId: query.shopId,
        productIds: query.productIds,
      },
      user,
    );

    reply
      .header("Content-Type", "text/csv; charset=utf-8")
      .header("Content-Disposition", `attachment; filename="${result.filename}"`)
      .send(result.stream);
  }
}
