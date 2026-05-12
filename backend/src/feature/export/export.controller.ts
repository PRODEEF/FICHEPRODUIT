import { Body, Controller, HttpCode, Post, Res, UseGuards } from "@nestjs/common";
import { FastifyReply } from "fastify";
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiProduces,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { JwtGuard } from "../../core/auth/guards/jwt.guard";
import { CurrentUser } from "../../core/auth/decorators/current-user.decorator";
import type { AuthenticatedUser } from "../../core/auth/types/jwt-payload.types";
import { ExportService } from "./export.service";
import { ExportProductsDto } from "./dto/export-products.dto";

/**
 * Export catalogue → CSV (colonnes alignées sur un template boutique).
 */
@ApiTags("Export")
@ApiBearerAuth("bearerAuth")
@UseGuards(JwtGuard)
@Controller("api/export")
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Post()
  @HttpCode(200)
  @ApiOperation({
    summary: "Exporter des produits en CSV",
    description:
      "Charge le template pour le shop indiqué (JWT), mappe les champs connus du catalogue, " +
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
  @ApiNotFoundResponse({ description: "Template introuvable ou aucun produit pour les IDs donnés" })
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
}
