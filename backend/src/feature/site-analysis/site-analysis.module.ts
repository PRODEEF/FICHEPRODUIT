import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { SiteAnalysisController } from './site-analysis.controller';
import { SiteAnalysisService } from './site-analysis.service';

@Module({
  imports: [AuthModule],
  controllers: [SiteAnalysisController],
  providers: [SiteAnalysisService],
})
export class SiteAnalysisModule {}
