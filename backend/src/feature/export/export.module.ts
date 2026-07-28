import { Module } from "@nestjs/common";

import { AuthModule } from "../../core/auth/auth.module";
import { ExportController } from "./export.controller";
import { CatalogModule } from "../../domain/catalog/catalog.module";
import { ShopModule } from "../../domain/shop/shop.module";
import { PrestashopCombinationMapper } from "./prestashop/prestashop-combination.mapper";
import { PrestashopCsvService } from "./prestashop/prestashop-csv.service";
import { PrestashopExportService } from "./prestashop/prestashop-export.service";
import { PrestashopProductMapper } from "./prestashop/prestashop-product.mapper";

/**
 * Feature export catalogue → CSV PrestaShop 8.
 */
@Module({
  imports: [AuthModule, CatalogModule, ShopModule],
  controllers: [ExportController],
  providers: [
    PrestashopExportService,
    PrestashopProductMapper,
    PrestashopCombinationMapper,
    PrestashopCsvService,
  ],
})
export class ExportModule {}
