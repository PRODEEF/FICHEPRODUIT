import { AnalysisPipelineService } from "./analysis-pipeline.service";
import type { IAnalysisRepository } from "./analysis.repository.interface";
import type { SiteScraperService } from "../../core/scraper/site-scraper.service";
import type { SiteClassifierService } from "../../core/scraper/site-classifier.service";
import type { ShopService } from "../shop/shop.service";

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
  } as unknown as jest.Mocked<SiteScraperService>;

  const classifierMock = {
    classify: jest.fn(),
  } as unknown as jest.Mocked<SiteClassifierService>;

  const shopServiceMock = {
    createOrUpdateFromAnalysis: jest.fn(),
  } as unknown as jest.Mocked<ShopService>;

  const service = new AnalysisPipelineService(
    analysisRepoMock,
    scraperMock,
    classifierMock,
    shopServiceMock,
  );

  beforeEach(() => {
    jest.clearAllMocks();
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

    const analysis = {
      id: "analysis-1",
      url: "https://guest-shop.test",
      status: "pending" as const,
      errorCode: null,
      errorMessage: null,
      userId: null,
      sessionId: "session-1",
      shopId: null,
      createdAt: new Date().toISOString(),
    };

    await (service as unknown as { run: (a: typeof analysis, t: string) => Promise<void> }).run(
      analysis,
      "",
    );

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
});
