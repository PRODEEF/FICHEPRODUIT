import { Module } from "@nestjs/common";
import { AnalysisController } from "./analysis.controller";
import { AnalysisService } from "./analysis.service";
import { AnalysisRepository } from "./analysis.repository";
import { ANALYSIS_REPOSITORY } from "./analysis.repository.interface";
import { AnalysisPipelineService } from "./analysis-pipeline.service";
import { ScraperModule } from "../../core/scraper/scraper.module";
import { ShopModule } from "../shop/shop.module";

@Module({
  imports: [
    ScraperModule, // SiteScraperService + SiteClassifierService
    ShopModule, // ShopService.createOrUpdateFromAnalysis()
  ],
  controllers: [AnalysisController],
  providers: [
    AnalysisService,
    AnalysisPipelineService,
    {
      provide: ANALYSIS_REPOSITORY,
      useClass: AnalysisRepository,
    },
  ],
  exports: [AnalysisService], // consommé par UserModule (rattachement session invité)
})
export class AnalysisModule {}
