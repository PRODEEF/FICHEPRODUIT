import { Injectable, Logger, Inject } from "@nestjs/common";
import { scheduleBackgroundWork } from "../../core/http/serverless-background";
import { SiteScraperService } from "../../core/scraper/site-scraper.service";
import { SiteClassifierService } from "../../core/scraper/site-classifier.service";
import { SiteCategoryExtractorService } from "../../core/scraper/site-category-extractor.service";
import { ShopService } from "../shop/shop.service";
import { ANALYSIS_REPOSITORY, type IAnalysisRepository } from "./analysis.repository.interface";
import type { Analysis } from "./analysis.types";

@Injectable()
export class AnalysisPipelineService {
  private readonly logger = new Logger(AnalysisPipelineService.name);

  constructor(
    @Inject(ANALYSIS_REPOSITORY)
    private readonly analysisRepo: IAnalysisRepository,
    private readonly scraper: SiteScraperService,
    private readonly classifier: SiteClassifierService,
    private readonly categoryExtractor: SiteCategoryExtractorService,
    private readonly shopService: ShopService,
  ) {}

  /**
   * Lance le pipeline en arrière-plan — fire and forget.
   * L'appelant reçoit immédiatement l'Analysis en status=pending.
   */
  runInBackground(analysis: Analysis, accessToken: string): void {
    const task = this.run(analysis, accessToken).catch((err) => {
      this.logger.error(`Pipeline crashed for ${analysis.id}`, err);
    });
    scheduleBackgroundWork(task);
  }

  private async run(analysis: Analysis, accessToken: string): Promise<void> {
    try {
      await this.analysisRepo.updateStatus(
        analysis.id,
        { status: "running" },
        accessToken,
        analysis.sessionId,
      );

      // 1. Fetch HTML
      const scrapeResult = await this.scraper.fetchPage(analysis.url);
      if (!scrapeResult.ok) {
        await this.analysisRepo.updateStatus(
          analysis.id,
          {
            status: "failed",
            errorCode: "SITE_UNREACHABLE",
            errorMessage: scrapeResult.error,
          },
          accessToken,
          analysis.sessionId,
        );
        return;
      }

      // 2. Classifier le site (marques / secteur) + extraction menu catégories
      const [classification, categoryTree] = await Promise.all([
        this.classifier.classify({
          url: analysis.url,
          html: scrapeResult.html,
          cms: scrapeResult.cms,
          title: scrapeResult.title,
          textSample: scrapeResult.textSample,
        }),
        this.categoryExtractor.extract({
          html: scrapeResult.html,
          cms: scrapeResult.cms,
          baseUrl: analysis.url,
        }),
      ]);

      // 3. Boutique persistée pour connecté OU invité (session_id)
      const shop = await this.shopService.createOrUpdateFromAnalysis(
        {
          url: analysis.url,
          cms: scrapeResult.cms,
          sector: classification.sector,
          brands: classification.brands,
          categoryTree,
          ownerId: analysis.userId,
          sessionId: analysis.sessionId,
        },
        accessToken,
      );
      const shopId = shop.id;

      // 4. Marquer l'analyse done
      await this.analysisRepo.updateStatus(
        analysis.id,
        {
          status: "done",
          errorCode: null,
          shopId,
        },
        accessToken,
        analysis.sessionId,
      );
    } catch (err) {
      this.logger.error(`Pipeline failed for ${analysis.id}`, err);
      await this.analysisRepo
        .updateStatus(
          analysis.id,
          {
            status: "failed",
            errorCode: "INTERNAL_ERROR",
            errorMessage: err instanceof Error ? err.message : "Erreur interne",
          },
          accessToken,
          analysis.sessionId,
        )
        .catch((updateErr) => {
          this.logger.error(`Failed to mark analysis ${analysis.id} as failed`, updateErr);
        });
    }
  }
}
