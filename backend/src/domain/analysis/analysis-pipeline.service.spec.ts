import { AnalysisPipelineService } from "./analysis-pipeline.service";
import type { IAnalysisRepository } from "./analysis.repository.interface";
import type { SiteScraperService } from "../../core/scraper/site-scraper.service";
import type { SiteClassifierService } from "../../core/scraper/site-classifier.service";
import type { ShopService } from "../shop/shop.service";
import type { Analysis } from "./analysis.types";

describe("AnalysisPipelineService", () => {
  const analysisRepoMock: jest.Mocked<IAnalysisRepository> = {
    findById: jest.fn(),
    findByIdForGuest: jest.fn(),
    findAllByUser: jest.fn(),
    create: jest.fn(),
    updateStatus: jest.fn(),
    transferToUser: jest.fn(),
  };

  const scraperMock = {
    fetchPage: jest.fn(),
  } as unknown as jest.Mocked<Pick<SiteScraperService, "fetchPage">> & {
    fetchPage: jest.Mock;
  };

  const classifierMock = {
    classify: jest.fn(),
  } as unknown as jest.Mocked<Pick<SiteClassifierService, "classify">> & {
    classify: jest.Mock;
  };

  const shopServiceMock = {
    createOrUpdateFromAnalysis: jest.fn(),
  } as unknown as jest.Mocked<Pick<ShopService, "createOrUpdateFromAnalysis">> & {
    createOrUpdateFromAnalysis: jest.Mock;
  };

  const service = new AnalysisPipelineService(
    analysisRepoMock,
    scraperMock as unknown as SiteScraperService,
    classifierMock as unknown as SiteClassifierService,
    shopServiceMock as unknown as ShopService,
  );

  const run = (analysis: Analysis, token: string) =>
    (service as unknown as { run: (a: Analysis, t: string) => Promise<void> }).run(analysis, token);

  const guestAnalysis: Analysis = {
    id: "analysis-1",
    url: "https://guest-shop.test",
    status: "pending",
    errorCode: null,
    errorMessage: null,
    userId: null,
    sessionId: "session-1",
    shopId: null,
    createdAt: new Date().toISOString(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    analysisRepoMock.updateStatus.mockResolvedValue(undefined);
  });

  it("crée un shop guest et marque l'analyse done avec shopId", async () => {
    scraperMock.fetchPage.mockResolvedValue({
      ok: true,
      html: "<html></html>",
      cms: "unknown",
      title: "Guest shop",
      textSample: "sample",
    });
    classifierMock.classify.mockResolvedValue({
      sector: "sport",
      brands: ["BrandA"],
      categories: ["CatA"],
      verticalSummary: "summary",
    });
    shopServiceMock.createOrUpdateFromAnalysis.mockResolvedValue({
      id: "shop-guest-1",
      name: "guest-shop",
      url: "https://guest-shop.test",
      cms: "inconnu",
      sector: "sport",
      brands: ["BrandA"],
      categories: ["CatA"],
      ownerId: null,
      sessionId: "session-1",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await run(guestAnalysis, "");

    expect(shopServiceMock.createOrUpdateFromAnalysis).toHaveBeenCalledWith(
      expect.objectContaining({
        ownerId: null,
        sessionId: "session-1",
        sector: null,
      }),
      "",
    );
    expect(analysisRepoMock.updateStatus).toHaveBeenCalledWith(
      "analysis-1",
      expect.objectContaining({
        status: "done",
        errorCode: null,
        shopId: "shop-guest-1",
      }),
      "",
      "session-1",
    );
  });

  it("marque SITE_UNREACHABLE quand le scrape échoue", async () => {
    scraperMock.fetchPage.mockResolvedValue({
      ok: false,
      error: "Timeout",
    });

    await run(guestAnalysis, "");

    expect(classifierMock.classify).not.toHaveBeenCalled();
    expect(shopServiceMock.createOrUpdateFromAnalysis).not.toHaveBeenCalled();
    expect(analysisRepoMock.updateStatus).toHaveBeenCalledWith(
      "analysis-1",
      expect.objectContaining({
        status: "failed",
        errorCode: "SITE_UNREACHABLE",
        errorMessage: "Timeout",
      }),
      "",
      "session-1",
    );
  });

  it("marque INTERNAL_ERROR si le classifier lève une exception", async () => {
    scraperMock.fetchPage.mockResolvedValue({
      ok: true,
      html: "<html></html>",
      cms: "shopify",
      title: "Shop",
      textSample: "sample",
    });
    classifierMock.classify.mockRejectedValue(new Error("OpenAI down"));

    await run(guestAnalysis, "");

    expect(analysisRepoMock.updateStatus).toHaveBeenCalledWith(
      "analysis-1",
      expect.objectContaining({
        status: "failed",
        errorCode: "INTERNAL_ERROR",
        errorMessage: "OpenAI down",
      }),
      "",
      "session-1",
    );
  });
});
