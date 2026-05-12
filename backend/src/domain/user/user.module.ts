import { Module } from "@nestjs/common";
import { AuthModule } from "../../core/auth/auth.module";
import { AnalysisModule } from "../analysis/analysis.module";
import { ShopModule } from "../shop/shop.module";
import { UserController } from "./user.controller";
import { UserService } from "./user.service";
import { UserRepository } from "./user.repository";
import { USER_REPOSITORY } from "./user.repository.interface";

@Module({
  imports: [AuthModule, AnalysisModule, ShopModule],
  controllers: [UserController],
  providers: [
    UserService,
    {
      provide: USER_REPOSITORY,
      useClass: UserRepository,
    },
  ],
  exports: [UserService],
})
export class UserModule {}
