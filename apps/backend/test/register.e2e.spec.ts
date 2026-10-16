import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { MikroORM } from '@mikro-orm/postgresql';
import request from 'supertest';
import { createTestApp, TestApp } from './support/test-app.js';

function registration(overrides: object = {}) {
  return {
    email: `${Bun.randomUUIDv7()}@example.com`,
    name: 'Ada Lovelace',
    password: 'correct horse battery',
    ...overrides,
  };
}

describe('POST /v1/auth/register (e2e)', () => {
  let testApp: TestApp;

  beforeAll(async () => {
    testApp = await createTestApp();
  });

  afterAll(async () => {
    await testApp.close();
  });

  function register(body: object) {
    return request(testApp.app.getHttpServer())
      .post('/v1/auth/register')
      .send(body);
  }

  async function storedPasswordHash(email: string): Promise<string> {
    const rows = await testApp.app
      .get(MikroORM)
      .em.getConnection()
      .execute<{ password_hash: string }[]>(
        `select i.password_hash from identities i
         join users u on u.id = i.user_id where u.email = ?`,
        [email],
      );
    expect(rows).toHaveLength(1);
    return rows[0].password_hash;
  }

  it('creates the user and returns it without credentials', async () => {
    const response = await register(
      registration({ email: ' Ada@Example.com ', name: ' Ada Lovelace ' }),
    ).expect(201);

    expect(response.body).toEqual({
      id: expect.any(String),
      email: 'ada@example.com',
      name: 'Ada Lovelace',
    });
  });

  it('stores the password as an argon2id hash', async () => {
    const body = registration();
    await register(body).expect(201);

    const hash = await storedPasswordHash(body.email);

    expect(hash).toStartWith('$argon2id$');
    expect(hash).not.toContain(body.password);
  });

  it('rejects an email that is already registered, whatever its case', async () => {
    const body = registration();
    await register(body).expect(201);

    const response = await register({
      ...body,
      email: body.email.toUpperCase(),
    })
      .expect(409)
      .expect('Content-Type', /application\/problem\+json/);

    expect(response.body).toEqual({
      type: '/problems/email-already-registered',
      title: 'Email already registered',
      status: 409,
      detail: 'An account with this email already exists',
      instance: '/v1/auth/register',
    });
  });

  it('still registers after a conflicting request', async () => {
    const body = registration();
    await register(body).expect(201);
    await register(body).expect(409);

    await register(registration()).expect(201);
  });

  it.each([
    ['an 8 character password', { password: 'x'.repeat(8) }],
    ['a 128 character password', { password: 'x'.repeat(128) }],
    ['a 100 character name', { name: 'x'.repeat(100) }],
  ])('accepts %s', async (_case, override) => {
    await register(registration(override)).expect(201);
  });

  it.each([
    ['an invalid email', { email: 'not-an-email' }, '#/email'],
    [
      'an email over 254 characters',
      { email: `${'x'.repeat(250)}@example.com` },
      '#/email',
    ],
    ['a missing email', { email: undefined }, '#/email'],
    ['a blank name', { name: '   ' }, '#/name'],
    ['a name over 100 characters', { name: 'x'.repeat(101) }, '#/name'],
    [
      'an email that only exceeds 254 characters once lowercased',
      {
        email: `${'\u0130'.repeat(32)}@${'a'.repeat(63)}.${'b'.repeat(63)}.${'c'.repeat(63)}.com`,
      },
      '#/email',
    ],
    ['a 7 character password', { password: 'x'.repeat(7) }, '#/password'],
    ['a 129 character password', { password: 'x'.repeat(129) }, '#/password'],
  ])('rejects %s', async (_case, override, pointer) => {
    const response = await register(registration(override)).expect(400);

    const pointers = response.body.errors.map(
      (error: { pointer: string }) => error.pointer,
    );
    expect(pointers).toContain(pointer);
  });

  it('rejects unknown properties', async () => {
    const response = await register(registration({ isAdmin: true })).expect(
      400,
    );

    expect(response.body.errors).toEqual([
      { pointer: '#/isAdmin', detail: 'property isAdmin should not exist' },
    ]);
  });
});
