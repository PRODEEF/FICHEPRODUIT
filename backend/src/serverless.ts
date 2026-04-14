import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import type { IncomingMessage, ServerResponse } from 'http';

let app: NestFastifyApplication;

async function bootstrap(): Promise<NestFastifyApplication> {
  if (app) return app;

  app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
    { logger: ['error', 'warn'] },
  );

  app.enableCors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  await app.init();
  await app.getHttpAdapter().getInstance().ready();

  return app;
}

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
) {
  const nestApp = await bootstrap();
  const fastify = nestApp.getHttpAdapter().getInstance();
  fastify.server.emit('request', req, res);
}
