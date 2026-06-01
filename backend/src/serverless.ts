import "reflect-metadata";
import type { IncomingMessage, ServerResponse } from "http";
import { createNestApp } from "./core/http/create-nest-app";
import type { NestFastifyApplication } from "@nestjs/platform-fastify";

let app: NestFastifyApplication;

async function bootstrap(): Promise<NestFastifyApplication> {
  if (app) return app;

  app = await createNestApp({
    swagger: false,
    logger: ["error", "warn"],
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
