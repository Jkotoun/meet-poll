import { afterEach, describe, expect, it } from 'bun:test';
import { Controller, Get, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { NodeEnv } from './config/environment.js';
import { configureApp } from './configure-app.js';

@Controller('things')
class ThingsController {
  @Get()
  list(): string[] {
    return [];
  }
}

async function createApp(nodeEnv: NodeEnv): Promise<INestApplication<App>> {
  const moduleRef = await Test.createTestingModule({
    controllers: [ThingsController],
  }).compile();
  const app = moduleRef.createNestApplication<INestApplication<App>>();
  configureApp(app, nodeEnv);
  await app.init();
  return app;
}

describe('configureApp', () => {
  let app: INestApplication<App> | undefined;

  afterEach(async () => {
    await app?.close();
    app = undefined;
  });

  it('serves controllers under /v1 by default', async () => {
    app = await createApp(NodeEnv.Development);
    const server = app.getHttpServer();
    await request(server).get('/v1/things').expect(200);
    await request(server).get('/things').expect(404);
  });

  it('serves the OpenAPI document outside production', async () => {
    app = await createApp(NodeEnv.Development);
    const response = await request(app.getHttpServer())
      .get('/docs-json')
      .expect(200);
    expect(Object.keys(response.body.paths)).toEqual(['/v1/things']);
  });

  it('documents problem+json as the default error response', async () => {
    app = await createApp(NodeEnv.Development);
    const response = await request(app.getHttpServer())
      .get('/docs-json')
      .expect(200);
    expect(
      response.body.paths['/v1/things'].get.responses.default.content,
    ).toEqual({
      'application/problem+json': {
        schema: { $ref: '#/components/schemas/ProblemDetailsDto' },
      },
    });
  });

  it('does not expose docs in production', async () => {
    app = await createApp(NodeEnv.Production);
    const server = app.getHttpServer();
    await request(server).get('/docs').expect(404);
    await request(server).get('/docs-json').expect(404);
  });
});
