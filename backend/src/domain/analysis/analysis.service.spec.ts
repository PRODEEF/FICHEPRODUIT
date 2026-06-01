import { NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { ANALYSIS_REPOSITORY, type IAnalysisRepository } from "./analysis.repository.interface";
import { AnalysisService } from "./analysis.service";
import { AnalysisPipelineService } from "./analysis-pipeline.service";

describe("AnalysisService", () => {
  let service: AnalysisService;
  const analysisRepo: jest.Mocked<IAnalysisRepository> = {
    findById: jest.fn(),
    findByIdForGuest: jest.fn(),
    findAllByUser: jest.fn(),
    create: jest.fn(),
    updateStatus: jest.fn(),
    transferToUser: jest.fn(),
  };
  const pipeline = { runInBackground: jest.fn() };

  const user = { id: "user-1", email: "a@b.com", accessToken: "tok" };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalysisService,
        { provide: ANALYSIS_REPOSITORY, useValue: analysisRepo },
        { provide: AnalysisPipelineService, useValue: pipeline },
      ],
    }).compile();

    service = module.get(AnalysisService);
  });

  it("create lance le pipeline et retourne l'analyse pending", async () => {
    const created = {
      id: "a1",
      url: "https://shop.test",
      status: "pending" as const,
      errorCode: null,
      errorMessage: null,
      userId: "user-1",
      sessionId: null,
      shopId: null,
      createdAt: "2024-01-01T00:00:00.000Z",
    };
    analysisRepo.create.mockResolvedValue(created);

    const result = await service.create("https://shop.test", user);

    expect(result).toEqual(created);
    expect(pipeline.runInBackground).toHaveBeenCalledWith(created, "tok");
  });

  it("getForUser lève NotFoundException si l'analyse n'appartient pas à l'utilisateur", async () => {
    analysisRepo.findById.mockResolvedValue({
      id: "a1",
      url: "https://x.com",
      status: "done",
      errorCode: null,
      errorMessage: null,
      userId: "other",
      sessionId: null,
      shopId: null,
      createdAt: "2024-01-01T00:00:00.000Z",
    });

    await expect(service.getForUser("a1", user)).rejects.toBeInstanceOf(NotFoundException);
  });

  it("createForGuest utilise le repo admin et lance le pipeline", async () => {
    const created = {
      id: "g1",
      url: "https://guest.test",
      status: "pending" as const,
      errorCode: null,
      errorMessage: null,
      userId: null,
      sessionId: "sess-1",
      shopId: null,
      createdAt: "2024-01-01T00:00:00.000Z",
    };
    analysisRepo.create.mockResolvedValue(created);

    const result = await service.createForGuest("https://guest.test", "sess-1");

    expect(analysisRepo.create).toHaveBeenCalledWith(
      { url: "https://guest.test", userId: null, sessionId: "sess-1" },
      "",
    );
    expect(pipeline.runInBackground).toHaveBeenCalledWith(created, "");
    expect(result.sessionId).toBe("sess-1");
  });
});
