import { Module } from "@nestjs/common";
import { AuthModule } from "../../core/auth/auth.module";
import { AnalysisModule } from "../analysis/analysis.module";
import { BillingModule } from "../billing/billing.module";
import { ShopModule } from "../shop/shop.module";
import { AccountDeletionService } from "./account-deletion.service";
import { UserController } from "./user.controller";
import { UserService } from "./user.service";
import { UserRepository } from "./user.repository";
import { USER_REPOSITORY } from "./user.repository.interface";

@Module({
  imports: [AuthModule, AnalysisModule, BillingModule, ShopModule],
  controllers: [UserController],
  providers: [
    UserService,
    AccountDeletionService,
    {
      provide: USER_REPOSITORY,
      useClass: UserRepository,
    },
  ],
  exports: [UserService],
})
export class UserModule {}
