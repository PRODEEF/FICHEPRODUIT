import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import cookie from "@fastify/cookie";
import { cleanupOpenApiDoc } from "nestjs-zod";
import { AppModule } from "../../app.module";
import { registerHttpSecurityPlugins } from "./fastify-security-plugins";

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

  const fastify = app.getHttpAdapter().getInstance();
  await registerHttpSecurityPlugins(fastify);
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
