import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { NestFactory } from '@nestjs/core';
import { configureVersioning } from '../src/configure-app.js';
import { createOpenApiDocument } from '../src/openapi/openapi-document.js';

// AppModule validates env when imported; preview mode never connects to the DB.
process.env.NODE_ENV ??= 'production';
process.env.DATABASE_URL ??= 'postgresql://openapi@localhost/openapi';
process.env.JWT_SECRET ??= 'openapi'.repeat(8);
process.env.PROXY_SECRET ??= 'openapi'.repeat(8);
const { AppModule } = await import('../src/app.module.js');

const app = await NestFactory.create(AppModule, {
  preview: true,
  abortOnError: false,
  logger: ['error'],
});
configureVersioning(app);
await writeFile(
  join(import.meta.dirname, '..', 'openapi.json'),
  `${JSON.stringify(createOpenApiDocument(app), null, 2)}\n`,
);
await app.close();
