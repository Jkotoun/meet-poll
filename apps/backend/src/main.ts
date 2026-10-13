import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Drain requests on Cloud Run's SIGTERM, then exit explicitly (we run as PID 1).
  app.enableShutdownHooks(['SIGTERM', 'SIGINT'], { useProcessExit: true });
  await app.listen(process.env.PORT ?? 3001);
}
await bootstrap();
