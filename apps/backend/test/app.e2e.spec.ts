import { afterAll, beforeAll, describe, it } from 'bun:test';
import request from 'supertest';
import { createTestApp, TestApp } from './support/test-app.js';

describe('AppController (e2e)', () => {
  let testApp: TestApp;

  beforeAll(async () => {
    testApp = await createTestApp();
  });

  afterAll(async () => {
    await testApp.close();
  });

  it('/ (GET)', () => {
    return request(testApp.app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });
});
