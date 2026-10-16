import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module.js';
import { Environment } from './config/environment.js';
import { configureApp } from './configure-app.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
  });
  // Drain requests on Cloud Run's SIGTERM, then exit explicitly (we run as PID 1).
  app.enableShutdownHooks(['SIGTERM', 'SIGINT'], { useProcessExit: true });
  const config = app.get<ConfigService<Environment, true>>(ConfigService);
  configureApp(app, config.get('NODE_ENV', { infer: true }));
  await app.listen(config.get('PORT', { infer: true }));
}
await bootstrap();
