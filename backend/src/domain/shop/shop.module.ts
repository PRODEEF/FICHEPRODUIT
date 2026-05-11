import { Module } from "@nestjs/common";
import { AuthModule } from "../../core/auth/auth.module";
import { ShopController } from "./shop.controller";
import { ShopService } from "./shop.service";
import { ShopRepository } from "./shop.repository";
import { SHOP_REPOSITORY } from "./shop.repository.interface";

@Module({
  imports: [AuthModule],
  controllers: [ShopController],
  providers: [
    ShopService,
    {
      provide: SHOP_REPOSITORY,
      useClass: ShopRepository,
    },
  ],
  exports: [ShopService],
})
export class ShopModule {}
