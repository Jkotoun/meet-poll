import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import request from 'supertest';
import { fromClientIp } from './support/client.js';
import { createTestApp, TestApp } from './support/test-app.js';

describe('Auth rate limits (e2e)', () => {
  let testApp: TestApp;

  beforeAll(async () => {
    testApp = await createTestApp();
  });

  afterAll(async () => {
    await testApp.close();
  });

  function logIn(email: string, ip: string) {
    return fromClientIp(
      request(testApp.app.getHttpServer()).post('/v1/auth/login'),
      ip,
    ).send({ email, password: 'not the password' });
  }

  function register(ip: string, email = `${Bun.randomUUIDv7()}@example.com`) {
    return fromClientIp(
      request(testApp.app.getHttpServer()).post('/v1/auth/register'),
      ip,
    ).send({ email, name: 'Ada', password: 'correct horse battery' });
  }

  async function exhaustEmailLimit(email: string, ipPrefix: string) {
    for (let attempt = 1; attempt <= 5; attempt++) {
      await logIn(email, `${ipPrefix}.${attempt}`).expect(401);
    }
  }

  it('allows 5 login attempts per email per minute, from any IP', async () => {
    await exhaustEmailLimit('target@example.com', '10.1.0');

    await logIn('Target@Example.com', '10.1.0.99').expect(429);
  });

  it('answers a limited request with a problem and Retry-After', async () => {
    await exhaustEmailLimit('limited@example.com', '10.1.1');

    const response = await logIn('limited@example.com', '10.1.1.99').expect(
      429,
    );

    expect(response.body).toMatchObject({
      title: 'Too Many Requests',
      status: 429,
    });
    expect(Number(response.get('Retry-After'))).toBeGreaterThan(0);
  });

  it('keeps other emails unaffected by one email being limited', async () => {
    await exhaustEmailLimit('busy@example.com', '10.1.2');

    await logIn('other@example.com', '10.1.2.99').expect(401);
  });

  it('allows 20 login attempts per IP per minute', async () => {
    for (let attempt = 1; attempt <= 20; attempt++) {
      await logIn(`user${attempt}@example.com`, '10.2.0.1').expect(401);
    }

    await logIn('fresh@example.com', '10.2.0.1').expect(429);
    await logIn('fresh@example.com', '10.2.0.2').expect(401);
  });

  it('allows 5 registrations per IP per hour', async () => {
    for (let attempt = 1; attempt <= 5; attempt++) {
      await register('10.3.0.1').expect(201);
    }

    await register('10.3.0.1').expect(429);
    await register('10.3.0.2').expect(201);
  });

  it('does not limit registrations per email', async () => {
    const email = `${Bun.randomUUIDv7()}@example.com`;
    await register('10.4.0.1', email).expect(201);

    for (let attempt = 2; attempt <= 7; attempt++) {
      await register(`10.4.0.${attempt}`, email).expect(409);
    }
  });

  it('does not count requests without an email against a shared bucket', async () => {
    for (let attempt = 1; attempt <= 6; attempt++) {
      await fromClientIp(
        request(testApp.app.getHttpServer()).post('/v1/auth/login'),
        `10.5.0.${attempt}`,
      )
        .send({ password: 'x' })
        .expect(400);
    }
  });
});
