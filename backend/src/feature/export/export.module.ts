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

/**
 * Feature export catalogue → CSV (colonnes standards + mapping direct / OpenAI).
 */
@Module({
  imports: [AuthModule, BillingModule, CatalogModule, ShopModule],
  controllers: [ExportController],
  providers: [ExportService, FieldMapperService, AiContentService, CsvBuilderService],
})
export class ExportModule {}
