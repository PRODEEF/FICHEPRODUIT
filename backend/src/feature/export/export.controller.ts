import { Controller, Get, HttpCode, Query, Res, UseGuards } from "@nestjs/common";
import { FastifyReply } from "fastify";
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiProduces,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { JwtGuard } from "../../core/auth/guards/jwt.guard";
import { CurrentUser } from "../../core/auth/decorators/current-user.decorator";
import type { AuthenticatedUser } from "../../core/auth/types/jwt-payload.types";
import { ExportPrestashopQueryDto } from "./dto/export-prestashop-query.dto";
import { PrestashopExportService } from "./prestashop/prestashop-export.service";

/**
 * Export catalogue → CSV PrestaShop 8 (products / combinations).
 */
@ApiTags("Export")
@ApiBearerAuth("bearerAuth")
@UseGuards(JwtGuard)
@Controller("api/export")
export class ExportController {
  constructor(private readonly prestashopExportService: PrestashopExportService) {}

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
