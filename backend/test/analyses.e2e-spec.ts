import { Test, TestingModule } from "@nestjs/testing";
import cookie from "@fastify/cookie";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import { AppModule } from "../src/app.module";
import { ANALYSIS_REPOSITORY } from "../src/domain/analysis/analysis.repository.interface";
import { AnalysisPipelineService } from "../src/domain/analysis/analysis-pipeline.service";

describe("AnalysesController (e2e)", () => {
  let app: NestFastifyApplication;
  const analysisRepo = {
    findById: jest.fn(),
    findByIdForGuest: jest.fn(),
    findAllByUser: jest.fn(),
    create: jest.fn(),
    updateStatus: jest.fn(),
    transferToUser: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ANALYSIS_REPOSITORY)
      .useValue(analysisRepo)
      .overrideProvider(AnalysisPipelineService)
      .useValue({ runInBackground: jest.fn() })
      .compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    await app.getHttpAdapter().getInstance().register(cookie);
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("POST /api/analyses sans body valide retourne 400", async () => {
    const result = await app.inject({
      method: "POST",
      url: "/api/analyses",
      payload: {},
    });

    expect(result.statusCode).toBe(400);
  });

  it("POST /api/analyses invité crée une analyse pending", async () => {
    analysisRepo.create.mockResolvedValue({
      id: "analysis-guest",
      url: "https://example-boutique.test",
      status: "pending",
      errorCode: null,
      errorMessage: null,
      userId: null,
      sessionId: "00000000-0000-4000-8000-000000000001",
      shopId: null,
      createdAt: new Date().toISOString(),
    });

    const result = await app.inject({
      method: "POST",
      url: "/api/analyses",
      headers: {
        "x-session-id": "00000000-0000-4000-8000-000000000001",
      },
      payload: { url: "https://example-boutique.test" },
    });

    expect(result.statusCode).toBe(201);
    const body = JSON.parse(result.payload) as { id: string; status: string };
    expect(body.id).toBe("analysis-guest");
    expect(body.status).toBe("pending");
  });
});
