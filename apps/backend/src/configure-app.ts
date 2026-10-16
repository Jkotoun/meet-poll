import { INestApplication, VersioningType } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { NodeEnv } from './config/environment.js';
import {
  API_VERSION,
  createOpenApiDocument,
} from './openapi/openapi-document.js';

export function configureVersioning(app: INestApplication): void {
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: API_VERSION,
  });
}

// The app must be created with `bodyParser: false`; only JSON bodies are parsed,
// so cross-site HTML form posts never reach a handler with data.
export function configureApp(
  app: NestExpressApplication,
  nodeEnv: NodeEnv,
): void {
  configureVersioning(app);
  app.useBodyParser('json');
  app.use(cookieParser());

  if (nodeEnv !== NodeEnv.Production) {
    SwaggerModule.setup('docs', app, () => createOpenApiDocument(app));
  }
}
