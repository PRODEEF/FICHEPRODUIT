import { Injectable, NotFoundException } from "@nestjs/common";

import { CatalogService } from "../../domain/catalog/catalog.service";
import { CreditService } from "../../domain/billing/credit.service";
import { ShopService } from "../../domain/shop/shop.service";
import { FieldMapperService } from "./mapper/field-mapper.service";
import { AiContentService } from "./mapper/ai-content.service";
import { CsvBuilderService } from "./csv/csv-builder.service";
import type { ExportRequest, ExportResult, MappedProduct } from "./types/export.types";
import type { AuthenticatedUser } from "../../core/auth/types/jwt-payload.types";
import type { CatalogProduct } from "../../domain/catalog/types/catalog.types";
import { DEFAULT_EXPORT_FIELDS, type ExportField } from "./types/export-field.types";

/**
 * Orchestre chargement produits, mappage direct / IA et rendu CSV.
 */
@Injectable()
export class ExportService {
  constructor(
    private readonly catalogService: CatalogService,
    private readonly shopService: ShopService,
    private readonly creditService: CreditService,
    private readonly fieldMapper: FieldMapperService,
    private readonly aiContent: AiContentService,
    private readonly csvBuilder: CsvBuilderService,
  ) {}

  /**
   * Génère un export CSV pour les produits demandés avec les colonnes catalogue standards.
   *
   * @throws NotFoundException Si la boutique n’est pas accessible, ou si aucun produit
   *   ne correspond aux IDs.
   */
  async export(req: ExportRequest, user: AuthenticatedUser): Promise<ExportResult> {
    await this.shopService.getForUser(req.shopId, user);

    const fields = DEFAULT_EXPORT_FIELDS;

    const products = await this.catalogService.findByIds(req.productIds);
    if (products.length === 0) throw new NotFoundException("Aucun produit trouvé");

    const exportProducts = products.map((p) => ({ id: p.id, price: p.price }));
    const exportMetadata = {
      productIds: req.productIds,
      exportRowCount: products.length,
    };

    const exportAttemptId = await this.creditService.reserveCreditsForExport(
      user.id,
      user.accessToken,
      exportProducts,
      exportMetadata,
    );

    let mappedProducts: MappedProduct[];
    try {
      mappedProducts = await Promise.all(
        products.map((product) => this.mapProduct(product, fields)),
      );
    } catch (err) {
      if (exportAttemptId) {
        await this.creditService.refundExportReservation(user.id, exportAttemptId);
      }
      throw err;
    }

    const csv = this.csvBuilder.build(mappedProducts, fields);
    const date = new Date().toISOString().split("T")[0];
    const sector = products[0]?.sector ?? "export";

    return {
      csv,
      filename: `export-${sector}-${date}.csv`,
      rowCount: mappedProducts.length,
    };
  }

  private async mapProduct(product: CatalogProduct, fields: ExportField[]): Promise<MappedProduct> {
    const { mapped, unresolved } = this.fieldMapper.mapDirectFields(product, fields);
    const aiFields = await this.aiContent.generateFields(product, unresolved);
    return {
      productId: product.id,
      fields: [...mapped, ...aiFields],
    };
  }
}
