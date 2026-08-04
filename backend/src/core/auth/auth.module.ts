import { Module } from "@nestjs/common";
import { EmailVerifiedGuard } from "./guards/email-verified.guard";
import { JwtGuard } from "./guards/jwt.guard";
import { OptionalJwtGuard } from "./guards/optional-jwt.guard";

@Module({
  providers: [JwtGuard, OptionalJwtGuard, EmailVerifiedGuard],
  exports: [JwtGuard, OptionalJwtGuard, EmailVerifiedGuard],
})
export class AuthModule {}
