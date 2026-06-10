import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import cookie from "@fastify/cookie";
import type { FastifyRequest } from "fastify";
import { Readable } from "node:stream";
import { cleanupOpenApiDoc } from "nestjs-zod";
import { AppModule } from "../../app.module";
import { buildCorsOptions } from "./cors-origin";
import { registerHttpSecurityPlugins } from "./fastify-security-plugins";

/** Route webhook Stripe — nécessite le corps brut pour la vérification de signature. */
const STRIPE_WEBHOOK_PATH = "/api/billing/stripe/webhook";

type FastifyRequestWithRawBody = FastifyRequest & { rawBody?: Buffer };

/**
 * Conserve une copie du corps brut uniquement pour le webhook Stripe.
 * Stripe exige le payload non parsé pour `constructEvent`.
 */
function registerStripeWebhookRawBody(app: NestFastifyApplication): void {
  const fastify = app.getHttpAdapter().getInstance();

  fastify.addHook("preParsing", (request, _reply, payload, done) => {
    if (request.url !== STRIPE_WEBHOOK_PATH) {
      done(null, payload);
      return;
    }

    const chunks: Buffer[] = [];
    payload.on("data", (chunk: Buffer) => {
      chunks.push(chunk);
    });
    payload.on("end", () => {
      const rawBody = Buffer.concat(chunks);
      (request as FastifyRequestWithRawBody).rawBody = rawBody;
      done(null, Readable.from(rawBody));
    });
    payload.on("error", (err: Error) => {
      done(err, undefined);
    });
  });
}

export type CreateNestAppOptions = {
  /** Active Swagger hors production (défaut : true). */
  swagger?: boolean;
  logger?: false | ("error" | "warn" | "log" | "debug" | "verbose")[];
};

/**
 * Bootstrap NestJS + Fastify (local et Vercel zero-config via `main.ts`).
 */
export async function createNestApp(
  options: CreateNestAppOptions = {},
): Promise<NestFastifyApplication> {
  const { swagger = true, logger } = options;

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
    logger !== undefined ? { logger } : undefined,
  );

  // ── CORS en premier, avant tout plugin de sécurité ──
  const configService = app.get(ConfigService);
  app.enableCors(
    buildCorsOptions({
      corsOrigin: configService.get<string>("corsOrigin", "*"),
      nodeEnv: configService.get<string>("nodeEnv", "development"),
      vercelEnv: configService.get<string | undefined>("vercelEnv"),
    }),
  );

  // ── Stripe raw body hook ──
  registerStripeWebhookRawBody(app);

  // ── Plugins de sécurité & cookie (après CORS) ──
  const fastify = app.getHttpAdapter().getInstance();
  await registerHttpSecurityPlugins(fastify);
  await fastify.register(cookie);

  // ── Swagger (hors production) ──
  const nodeEnv = configService.get<string>("nodeEnv", "development");
  if (swagger && nodeEnv !== "production") {
    const swaggerConfig = new DocumentBuilder()
      .setTitle("FicheProduit API")
      .setDescription(
        "Documentation OpenAPI générée à partir des contrôleurs NestJS et des schémas Zod (nestjs-zod).",
      )
      .setVersion("1.0")
      .addBearerAuth(
        { type: "http", scheme: "bearer", bearerFormat: "JWT", in: "header" },
        "bearerAuth",
      )
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup("api/docs", app, cleanupOpenApiDoc(document));
  }

  return app;
}
