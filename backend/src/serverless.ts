import "reflect-metadata";
import cookie from "@fastify/cookie";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import type { IncomingMessage, ServerResponse } from "http";
import { AppModule } from "./app.module";

let app: NestFastifyApplication;

async function bootstrap(): Promise<NestFastifyApplication> {
  if (app) return app;

  app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter(), {
    logger: ["error", "warn"],
  });

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

  return app;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const nestApp = await bootstrap();
  const fastify = nestApp.getHttpAdapter().getInstance();
  fastify.server.emit("request", req, res);
}
