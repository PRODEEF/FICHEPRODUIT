import { Module } from "@nestjs/common";
import { ShopModule } from "../shop/shop.module";
import { ProductTemplateController } from "./product-template.controller";
import { ProductTemplateService } from "./product-template.service";
import { ProductTemplateRepository } from "./product-template.repository";
import { PRODUCT_TEMPLATE_REPOSITORY } from "./product-template.repository.interface";
import { ScrapeFieldsService } from "./sub-services/scrape-fields.service";
import { RefineFieldsService } from "./sub-services/refine-fields.service";

@Module({
  imports: [ShopModule],
  controllers: [ProductTemplateController],
  providers: [
    ProductTemplateService,
    ScrapeFieldsService,
    RefineFieldsService,
    {
      provide: PRODUCT_TEMPLATE_REPOSITORY,
      useClass: ProductTemplateRepository,
    },
  ],
  exports: [ProductTemplateService],
})
export class ProductTemplateModule {}
