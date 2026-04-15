import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './feature/health';
import { SiteAnalysisModule } from './feature/site-analysis';
import { SuggestUrlsModule } from './feature/suggest-urls';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    AuthModule,
    HealthModule,
    SuggestUrlsModule,
    SiteAnalysisModule,
  ],
})
export class AppModule {}
