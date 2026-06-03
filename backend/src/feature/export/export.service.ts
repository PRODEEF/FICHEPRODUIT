import { Injectable, NotFoundException } from "@nestjs/common";
import { CatalogService } from "@/domain/catalog/catalog.service";
import { ProductTemplateService } from "@/domain/product-template/product-template.service";
import { FieldMapperService } from "./mapper/field-mapper.service";
import { AiContentService } from "./mapper/ai-content.service";
import { CsvBuilderService } from "./csv/csv-builder.service";
import type { ExportRequest, ExportResult, MappedProduct } from "./types/export.types";
import type { AuthenticatedUser } from "../../core/auth/types/jwt-payload.types";
import type { CatalogProduct } from "@/domain/catalog/types/catalog.types";
import type { ProductTemplateField } from "@/domain/product-template/types/product-template.types";

/**
 * Orchestre chargement template + produits, mappage direct / IA et rendu CSV.
 */
@Injectable()
export class ExportService {
  constructor(
    private readonly catalogService: CatalogService,
    private readonly templateService: ProductTemplateService,
    private readonly fieldMapper: FieldMapperService,
    private readonly aiContent: AiContentService,
    private readonly csvBuilder: CsvBuilderService,
  ) {}

  /**
   * Génère un export CSV pour les produits demandés selon le template du shop.
   *
   * @throws NotFoundException Si le template est introuvable ou non accessible, ou si aucun produit
   *   ne correspond aux IDs (pas de CSV partiel dans ces cas).
   */
  async export(req: ExportRequest, user: AuthenticatedUser): Promise<ExportResult> {
    const template = await this.templateService.getTemplateForShop(
      req.templateId,
      req.shopId,
      user,
    );
    if (!template) throw new NotFoundException("Gabarit introuvable");

    const products = await this.catalogService.findByIds(req.productIds);
    if (products.length === 0) throw new NotFoundException("Aucun produit trouvé");

    const mappedProducts: MappedProduct[] = await Promise.all(
      products.map((product) => this.mapProduct(product, template.fields)),
    );

    const csv = this.csvBuilder.build(mappedProducts, template.fields);
    const date = new Date().toISOString().split("T")[0];
    const sector = products[0]?.sector ?? "export";

    return {
      csv,
      filename: `export-${sector}-${date}.csv`,
      rowCount: mappedProducts.length,
    };
  }

  private async mapProduct(
    product: CatalogProduct,
    fields: ProductTemplateField[],
  ): Promise<MappedProduct> {
    const { mapped, unresolved } = this.fieldMapper.mapDirectFields(product, fields);
    const aiFields = await this.aiContent.generateFields(product, unresolved);
    return {
      productId: product.id,
      fields: [...mapped, ...aiFields],
    };
  }
}
