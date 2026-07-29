import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { APP_PIPE } from "@nestjs/core";
import { Test, TestingModule } from "@nestjs/testing";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import { ConfigModule } from "@nestjs/config";
import { ZodValidationPipe } from "nestjs-zod";

import { ExportModule } from "../src/feature/export/export.module";
import { JwtGuard } from "../src/core/auth/guards/jwt.guard";
import { SupabaseModule } from "../src/core/supabase/supabase.module";
import configuration from "../src/core/config/configuration";
import { CatalogService } from "../src/domain/catalog/catalog.service";
import { ShopService } from "../src/domain/shop/shop.service";
import { sampleCatalogProduct } from "../src/feature/export/prestashop/prestashop-test.fixtures";

/** Remplace JwtGuard pour les e2e : injecte un utilisateur sans appeler Supabase. */
@Injectable()
class E2eJwtStub implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    req.user = {
      id: "550e8400-e29b-41d4-a716-446655440099",
      email: "e2e@test.com",
      accessToken: "e2e-token",
    };
    return true;
  }
}

describe("ExportController (e2e)", () => {
  let app: NestFastifyApplication;

  const product = sampleCatalogProduct();
  const shopId = "550e8400-e29b-41d4-a716-446655440003";

  beforeAll(async () => {
    process.env.SUPABASE_URL = process.env.SUPABASE_URL ?? "https://test.supabase.co";
    process.env.SUPABASE_ANON_KEY =
      process.env.SUPABASE_ANON_KEY ?? "eyJhbGciOiJIUzI1NiJ9.test-anon";
    process.env.SUPABASE_SERVICE_ROLE_KEY =
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? "eyJhbGciOiJIUzI1NiJ9.test-service";
    process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY ?? "sk-test";
    process.env.TAVILY_API_KEY = process.env.TAVILY_API_KEY ?? "tvly-test";

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [configuration],
          ignoreEnvFile: true,
        }),
        SupabaseModule,
        ExportModule,
      ],
      providers: [
        {
          provide: APP_PIPE,
          useClass: ZodValidationPipe,
        },
      ],
    })
      .overrideGuard(JwtGuard)
      .useClass(E2eJwtStub)
      .overrideProvider(CatalogService)
      .useValue({
        findByIds: jest.fn().mockResolvedValue([product]),
      })
      .overrideProvider(ShopService)
      .useValue({
        getForUser: jest.fn().mockResolvedValue({ id: shopId, categoryTree: [] }),
      })
      .compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it("POST /api/export/prestashop?type=products — 200 et products.csv", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/export/prestashop",
      payload: {
        type: "products",
        shopId,
        productIds: [product.id],
      },
    });

    expect(res.statusCode).toBe(200);
    expect(res.headers["content-type"]).toMatch(/text\/csv/);
    expect(res.headers["content-disposition"]).toBe('attachment; filename="products.csv"');
    expect(res.payload.startsWith("\uFEFF") || res.payload.includes(";")).toBe(true);
  });

  it("POST /api/export/prestashop?type=combinations — 200 et combinations.csv", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/export/prestashop",
      payload: {
        type: "combinations",
        shopId,
        productIds: [product.id],
      },
    });

    expect(res.statusCode).toBe(200);
    expect(res.headers["content-disposition"]).toBe('attachment; filename="combinations.csv"');
  });

  it("GET /api/export/prestashop?type=products — 200 et products.csv (legacy)", async () => {
    const res = await app.inject({
      method: "GET",
      url: `/api/export/prestashop?type=products&shopId=${shopId}&productIds=${product.id}`,
    });

    expect(res.statusCode).toBe(200);
    expect(res.headers["content-type"]).toMatch(/text\/csv/);
    expect(res.headers["content-disposition"]).toBe('attachment; filename="products.csv"');
    expect(res.payload.startsWith("\uFEFF") || res.payload.includes(";")).toBe(true);
  });

  it("GET /api/export/prestashop?type=combinations — 200 et combinations.csv (legacy)", async () => {
    const res = await app.inject({
      method: "GET",
      url: `/api/export/prestashop?type=combinations&shopId=${shopId}&productIds=${product.id}`,
    });

    expect(res.statusCode).toBe(200);
    expect(res.headers["content-disposition"]).toBe('attachment; filename="combinations.csv"');
  });
});
