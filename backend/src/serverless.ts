import { NestFactory } from '@nestjs/core';
import type { Request, Response } from 'express';
import { AppModule } from './app.module';
import { setupApp } from './app.setup';

type Handler = (req: Request, res: Response) => void;

// Cache the app across invocations of a warm serverless instance
let cachedHandler: Promise<Handler> | null = null;

async function createHandler(): Promise<Handler> {
  // Throw instead of process.exit() so a failed cold start can be retried
  const app = await NestFactory.create(AppModule, { abortOnError: false });
  setupApp(app);
  await app.init();
  return app.getHttpAdapter().getInstance();
}

export default async function handler(req: Request, res: Response) {
  if (!cachedHandler) {
    cachedHandler = createHandler().catch((error) => {
      cachedHandler = null;
      throw error;
    });
  }
  const expressApp = await cachedHandler;
  expressApp(req, res);
}
