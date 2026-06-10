import { Module } from "@nestjs/common";

import { AuthModule } from "../../core/auth/auth.module";
import { ExportController } from "./export.controller";
import { ExportService } from "./export.service";
import { FieldMapperService } from "./mapper/field-mapper.service";
import { AiContentService } from "./mapper/ai-content.service";
import { CsvBuilderService } from "./csv/csv-builder.service";
import { BillingModule } from "../../domain/billing/billing.module";
import { CatalogModule } from "../../domain/catalog/catalog.module";
import { ProductTemplateModule } from "../../domain/product-template/product-template.module";

/**
 * Feature export catalogue → CSV (template boutique + mapping direct / OpenAI).
 */
@Module({
  imports: [AuthModule, BillingModule, CatalogModule, ProductTemplateModule],
  controllers: [ExportController],
  providers: [ExportService, FieldMapperService, AiContentService, CsvBuilderService],
})
export class ExportModule {}
