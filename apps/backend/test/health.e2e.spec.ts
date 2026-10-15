import { afterAll, beforeAll, describe, it } from 'bun:test';
import request from 'supertest';
import { createTestApp, TestApp } from './support/test-app.js';

describe('HealthController (e2e)', () => {
  let testApp: TestApp;

  beforeAll(async () => {
    testApp = await createTestApp();
  });

  afterAll(async () => {
    await testApp.close();
  });

  it('GET /health returns ok', () => {
    return request(testApp.app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect({ status: 'ok' });
  });

  it('is not versioned', () => {
    return request(testApp.app.getHttpServer()).get('/v1/health').expect(404);
  });
});
