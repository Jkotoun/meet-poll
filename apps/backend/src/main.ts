import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Cloud Run sends SIGTERM before stopping an instance. app.close() lets
  // in-flight requests finish (bounded by Cloud Run's grace period) and
  // closes idle keep-alive sockets; process.exit then ends the process
  // explicitly instead of relying on how PID 1 treats a re-raised signal.
  app.enableShutdownHooks(['SIGTERM', 'SIGINT'], { useProcessExit: true });
  await app.listen(process.env.PORT ?? 3001);
}
await bootstrap();
