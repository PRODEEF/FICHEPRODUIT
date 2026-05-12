import { Module } from "@nestjs/common";
import { JwtGuard } from "./guards/jwt.guard";
import { OptionalJwtGuard } from "./guards/optional-jwt.guard";

@Module({
  providers: [JwtGuard, OptionalJwtGuard],
  exports: [JwtGuard, OptionalJwtGuard],
})
export class AuthModule {}
