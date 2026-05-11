import { Module } from "@nestjs/common";
import { AuthModule } from "../../core/auth/auth.module";
import { ShopModule } from "../shop/shop.module";
import { CatalogController } from "./catalog.controller";
import { CatalogService } from "./catalog.service";
import { CatalogRepository } from "./catalog.repository";
import { CATALOG_REPOSITORY } from "./catalog.repository.interface";

@Module({
  imports: [AuthModule, ShopModule],
  controllers: [CatalogController],
  providers: [
    CatalogService,
    {
      provide: CATALOG_REPOSITORY,
      useClass: CatalogRepository,
    },
  ],
  exports: [CatalogService],
})
export class CatalogModule {}
