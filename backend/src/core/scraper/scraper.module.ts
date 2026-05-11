import { Module } from "@nestjs/common";
import { SiteScraperService } from "./site-scraper.service";
import { SiteClassifierService } from "./site-classifier.service";

@Module({
  providers: [SiteScraperService, SiteClassifierService],
  exports: [SiteScraperService, SiteClassifierService],
})
export class ScraperModule {}
