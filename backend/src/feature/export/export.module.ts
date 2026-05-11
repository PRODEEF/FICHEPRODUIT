import { Module } from "@nestjs/common";
import { ExportController } from "./export.controller";
import { ExportService } from "./export.service";
import { FieldMapperService } from "./mapper/field-mapper.service";
import { AiContentService } from "./mapper/ai-content.service";
import { CsvBuilderService } from "./csv/csv-builder.service";
import { CatalogModule } from "@/domain/catalog/catalog.module";
import { ProductTemplateModule } from "@/domain/product-template/product-template.module";

/**
 * Feature export catalogue → CSV (template boutique + mapping direct / OpenAI).
 */
@Module({
  imports: [CatalogModule, ProductTemplateModule],
  controllers: [ExportController],
  providers: [ExportService, FieldMapperService, AiContentService, CsvBuilderService],
})
export class ExportModule {}
