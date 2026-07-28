import { Module } from "@nestjs/common";
import { SiteScraperService } from "./site-scraper.service";
import { SiteClassifierService } from "./site-classifier.service";
import { SiteCategoryExtractorService } from "./site-category-extractor.service";

@Module({
  providers: [SiteScraperService, SiteClassifierService, SiteCategoryExtractorService],
  exports: [SiteScraperService, SiteClassifierService, SiteCategoryExtractorService],
})
export class ScraperModule {}
