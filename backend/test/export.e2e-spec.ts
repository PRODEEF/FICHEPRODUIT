import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { ConfigModule } from '@nestjs/config';
import { ExportModule } from '../src/feature/export/export.module';
import { JwtGuard } from '../src/core/auth/guards/jwt.guard';
import { OptionalJwtGuard } from '../src/core/auth/guards/optional-jwt.guard';
import { AiContentService } from '../src/feature/export/mapper/ai-content.service';
import { SupabaseModule } from '../src/core/supabase/supabase.module';
import configuration from '../src/core/config/configuration';
import { CatalogService } from '@/domain/catalog/catalog.service';
import { ProductTemplateService } from '@/domain/product-template/product-template.service';
import type { CatalogProduct } from '@/domain/catalog/types/catalog.types';
import type { ProductTemplate } from '@/domain/product-template/types/product-template.types';

/** Remplace JwtGuard pour les e2e : injecte un utilisateur sans appeler Supabase. */
@Injectable()
class E2eJwtStub implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    req.user = {
      id: '550e8400-e29b-41d4-a716-446655440099',
      email: 'e2e@test.com',
      accessToken: 'e2e-token',
    };
    return true;
  }
}

/** Remplace OptionalJwtGuard pour les e2e sans client Supabase sur les routes catalogue. */
@Injectable()
class E2eOptionalJwtStub implements CanActivate {
  canActivate(): boolean {
    return true;
  }
}

describe('ExportController (e2e)', () => {
  let app: NestFastifyApplication;

  const productId = '550e8400-e29b-41d4-a716-446655440001';
  const templateId = '550e8400-e29b-41d4-a716-446655440002';
  const shopId = '550e8400-e29b-41d4-a716-446655440003';

  const sampleProduct = (): CatalogProduct => ({
    id: productId,
    name: 'Casque',
    brand: 'Audio Co',
    sector: 'audio',
    category: 'Son',
    subCategory: null,
    year: 2025,
    price: 199,
    description: 'ANC',
    detailedDescription: '',
    images: [],
    url: 'https://ex.test/p',
    attributes: {},
  });

  const sampleTemplate = (): ProductTemplate => ({
    id: templateId,
    name: 'Export T',
    shopId,
    fields: [
      {
        name: "name",
        type: "text",
        required: true,
        order: 0,
      },
      {
        name: "prix",
        type: "price",
        required: true,
        order: 1,
      },
    ],
  });

  beforeAll(async () => {
    process.env.SUPABASE_URL = process.env.SUPABASE_URL ?? 'https://test.supabase.co';
    process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY ?? 'eyJhbGciOiJIUzI1NiJ9.test-anon';
    process.env.SUPABASE_SERVICE_ROLE_KEY =
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'eyJhbGciOiJIUzI1NiJ9.test-service';
    process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY ?? 'sk-test';
    process.env.TAVILY_API_KEY = process.env.TAVILY_API_KEY ?? 'tvly-test';

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
    })
      .overrideGuard(JwtGuard)
      .useClass(E2eJwtStub)
      .overrideProvider(OptionalJwtGuard)
      .useClass(E2eOptionalJwtStub)
      .overrideProvider(CatalogService)
      .useValue({
        findByIds: jest.fn().mockResolvedValue([sampleProduct()]),
      })
      .overrideProvider(ProductTemplateService)
      .useValue({
        getTemplateForShop: jest.fn().mockResolvedValue(sampleTemplate()),
      })
      .overrideProvider(AiContentService)
      .useValue({
        generateFields: jest.fn().mockResolvedValue([]),
      })
      .compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it('POST /api/export — 200, CSV et en-têtes fichier', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/export',
      headers: { 'content-type': 'application/json' },
      payload: JSON.stringify({
        productIds: [productId],
        templateId,
        shopId,
      }),
    });

    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/csv/);
    expect(res.headers['content-disposition']).toMatch(/attachment; filename="export-audio-\d{4}-\d{2}-\d{2}\.csv"/);
    expect(res.payload).toBe('name,prix\nCasque,199');
  });
});
