import { Test, TestingModule } from "@nestjs/testing";
import cookie from "@fastify/cookie";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import { ConfigService } from "@nestjs/config";
import { AppModule } from "../src/app.module";

describe("AppController (e2e)", () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    const fastify = app.getHttpAdapter().getInstance();
    await fastify.register(cookie);
    const configService = app.get(ConfigService);
    const corsOrigin = configService.get<string>("corsOrigin", "*");
    app.enableCors({
      origin: corsOrigin === "*" ? true : corsOrigin.split(",").map((o) => o.trim()),
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "x-session-id", "Cookie"],
      preflightContinue: false,
      optionsSuccessStatus: 204,
    });
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("/health (GET)", async () => {
    const result = await app.inject({
      method: "GET",
      url: "/health",
    });

    expect(result.statusCode).toBe(200);

    const body = JSON.parse(result.payload) as { status: string; timestamp: string };
    expect(body.status).toBe("ok");
    expect(body.timestamp).toBeDefined();
    expect(new Date(body.timestamp).toISOString()).toBe(body.timestamp);
  });

  it("preflight /api/analyses autorise x-session-id", async () => {
    const result = await app.inject({
      method: "OPTIONS",
      url: "/api/analyses",
      headers: {
        origin: "http://localhost:5173",
        "access-control-request-method": "POST",
        "access-control-request-headers": "content-type,x-session-id",
      },
    });

    expect(result.statusCode).toBe(204);
    expect(result.headers["access-control-allow-origin"]).toBe("http://localhost:5173");
    expect(result.headers["access-control-allow-headers"]).toContain("x-session-id");
  });
});
