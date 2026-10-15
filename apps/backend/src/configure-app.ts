import { INestApplication, VersioningType } from '@nestjs/common';
import { SwaggerModule } from '@nestjs/swagger';
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

export function configureApp(app: INestApplication, nodeEnv: NodeEnv): void {
  configureVersioning(app);

  if (nodeEnv !== NodeEnv.Production) {
    SwaggerModule.setup('docs', app, () => createOpenApiDocument(app));
  }
}
