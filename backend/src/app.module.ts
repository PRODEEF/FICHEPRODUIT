import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_PIPE } from "@nestjs/core";
import { ZodValidationPipe } from "nestjs-zod";
import configuration from "./core/config/configuration";

// core/
import { SupabaseModule } from "./core/supabase/supabase.module";
import { AuthModule } from "./core/auth/auth.module";

// domain/
import { AnalysisModule } from "./domain/analysis/analysis.module";
import { CatalogModule } from "./domain/catalog/catalog.module";
import { ProductTemplateModule } from "./domain/product-template/product-template.module";
import { ShopModule } from "./domain/shop/shop.module";
import { UserModule } from "./domain/user/user.module";

// feature/
import { ExportModule } from "./feature/export/export.module";
import { HealthModule } from "./feature/health/health.module";
import { SuggestUrlsModule } from "./feature/suggest-urls/suggest-urls.module";

@Module({
  imports: [
    // Infrastructure
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      ignoreEnvFile: process.env["NODE_ENV"] === "production",
    }),
    SupabaseModule, // @Global() — disponible partout sans ré-importer

    // core/auth — guards et décorateur @CurrentUser
    AuthModule,

    // domain/ — modules métier
    AnalysisModule,
    CatalogModule,
    ProductTemplateModule,
    ShopModule,
    UserModule,

    // feature/ — orchestration transverse
    ExportModule,
    HealthModule,
    SuggestUrlsModule,
  ],
  providers: [
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
  ],
})
export class AppModule {}
