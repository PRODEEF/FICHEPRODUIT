import { Module } from "@nestjs/common";
import { AuthModule } from "../../core/auth/auth.module";
import { SuggestUrlsController } from "./suggest-urls.controller";
import { SuggestUrlsService } from "./suggest-urls.service";

@Module({
  imports: [AuthModule],
  controllers: [SuggestUrlsController],
  providers: [SuggestUrlsService],
})
export class SuggestUrlsModule {}
