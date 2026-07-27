import { Module } from "@nestjs/common";

import { AuthModule } from "../../core/auth/auth.module";
import { ExportController } from "./export.controller";
import { ExportService } from "./export.service";
import { FieldMapperService } from "./mapper/field-mapper.service";
import { AiContentService } from "./mapper/ai-content.service";
import { CsvBuilderService } from "./csv/csv-builder.service";
import { BillingModule } from "../../domain/billing/billing.module";
import { CatalogModule } from "../../domain/catalog/catalog.module";
import { ShopModule } from "../../domain/shop/shop.module";
import { PrestashopCombinationMapper } from "./prestashop/prestashop-combination.mapper";
import { PrestashopCsvService } from "./prestashop/prestashop-csv.service";
import { PrestashopExportService } from "./prestashop/prestashop-export.service";
import { PrestashopProductMapper } from "./prestashop/prestashop-product.mapper";

/**
 * Feature export catalogue → CSV (colonnes standards + mapping direct / OpenAI + PrestaShop 8).
 */
@Module({
  imports: [AuthModule, BillingModule, CatalogModule, ShopModule],
  controllers: [ExportController],
  providers: [
    ExportService,
    FieldMapperService,
    AiContentService,
    CsvBuilderService,
    PrestashopExportService,
    PrestashopProductMapper,
    PrestashopCombinationMapper,
    PrestashopCsvService,
  ],
})
export class ExportModule {}
