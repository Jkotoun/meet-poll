import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { MikroORM } from '@mikro-orm/postgresql';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { createTestApp, TestApp } from './support/test-app.js';

const password = 'correct horse battery';

interface Account {
  id: string;
  email: string;
  cookie: string;
}

function newEmail(): string {
  return `${Bun.randomUUIDv7()}@example.com`;
}

function sessionCookie(response: request.Response): string {
  const cookies = response.get('Set-Cookie') ?? [];
  const session = cookies.find((cookie) => cookie.startsWith('session='));
  expect(session).toBeDefined();
  return session as string;
}

describe('Auth session (e2e)', () => {
  let testApp: TestApp;

  beforeAll(async () => {
    testApp = await createTestApp();
  });

  afterAll(async () => {
    await testApp.close();
  });

  function server() {
    return testApp.app.getHttpServer();
  }

  async function registeredAccount(): Promise<Account> {
    const email = newEmail();
    const response = await request(server())
      .post('/v1/auth/register')
      .send({ email, name: 'Ada', password })
      .expect(201);
    return {
      id: response.body.id,
      email,
      cookie: sessionCookie(response).split(';')[0],
    };
  }

  function me(cookie?: string) {
    const test = request(server()).get('/v1/auth/me');
    return cookie ? test.set('Cookie', cookie) : test;
  }

  function signedToken(secret: string, claims: object, options = {}): string {
    return new JwtService({ secret }).sign(claims, {
      audience: 'session',
      ...options,
    });
  }

  it('starts a session on register', async () => {
    const account = await registeredAccount();

    const response = await me(account.cookie).expect(200);

    expect(response.body).toEqual({
      id: account.id,
      email: account.email,
      name: 'Ada',
    });
  });

  it('starts a session on login that /me accepts', async () => {
    const account = await registeredAccount();

    const login = await request(server())
      .post('/v1/auth/login')
      .send({ email: account.email, password })
      .expect(200);
    const response = await me(sessionCookie(login).split(';')[0]).expect(200);

    expect(response.body.id).toBe(account.id);
  });

  it('logs in with the email in any case', async () => {
    const account = await registeredAccount();

    const response = await request(server())
      .post('/v1/auth/login')
      .send({ email: account.email.toUpperCase(), password })
      .expect(200);

    expect(response.body).toMatchObject({
      id: account.id,
      email: account.email,
    });
  });

  it('sets an httpOnly, SameSite=Lax, non-cacheable session cookie', async () => {
    const account = await registeredAccount();

    const response = await request(server())
      .post('/v1/auth/login')
      .send({ email: account.email, password })
      .expect(200)
      .expect('Cache-Control', 'no-store');

    const cookie = sessionCookie(response);
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Lax');
    expect(cookie).toContain('Path=/');
    expect(cookie).toContain('Max-Age=604800');
  });

  it('answers a wrong password and an unknown email identically', async () => {
    const account = await registeredAccount();

    const wrongPassword = await request(server())
      .post('/v1/auth/login')
      .send({ email: account.email, password: 'not the password' })
      .expect(401);
    const unknownEmail = await request(server())
      .post('/v1/auth/login')
      .send({ email: newEmail(), password })
      .expect(401);

    const expected = {
      type: '/problems/invalid-credentials',
      title: 'Invalid credentials',
      status: 401,
      detail: 'The email or password is incorrect',
      instance: '/v1/auth/login',
    };
    expect(wrongPassword.body).toEqual(expected);
    expect(unknownEmail.body).toEqual(expected);
    expect(wrongPassword.get('Set-Cookie')).toBeUndefined();
  });

  it('ignores form-encoded bodies, so cross-site forms cannot log in', async () => {
    const account = await registeredAccount();

    await request(server())
      .post('/v1/auth/login')
      .type('form')
      .send({ email: account.email, password })
      .expect(400);
  });

  it('requires a session for /me', async () => {
    const response = await me().expect(401);

    expect(response.body).toMatchObject({
      type: '/problems/unauthenticated',
      title: 'Authentication required',
    });
  });

  it('rejects a tampered token', async () => {
    const { cookie } = await registeredAccount();

    await me(`${cookie.slice(0, -2)}xx`).expect(401);
  });

  it('rejects a token signed with another secret', async () => {
    const { id } = await registeredAccount();
    const token = signedToken('another-secret-of-at-least-32-chars', {
      sub: id,
    });

    await me(`session=${token}`).expect(401);
  });

  it('rejects an expired token', async () => {
    const { id } = await registeredAccount();
    const token = signedToken(process.env.JWT_SECRET ?? '', {
      sub: id,
      exp: Math.floor(Date.now() / 1000) - 60,
    });

    await me(`session=${token}`).expect(401);
  });

  it('rejects a token meant for another audience', async () => {
    const { id } = await registeredAccount();
    const token = signedToken(
      process.env.JWT_SECRET ?? '',
      { sub: id },
      { audience: 'password-reset' },
    );

    await me(`session=${token}`).expect(401);
  });

  it('ends the session of a deleted user', async () => {
    const account = await registeredAccount();
    await testApp.app
      .get(MikroORM)
      .em.getConnection()
      .execute('delete from users where id = ?', [account.id]);

    await me(account.cookie).expect(401);
  });

  it('rejects an empty login request', async () => {
    const response = await request(server())
      .post('/v1/auth/login')
      .send({})
      .expect(400);

    const pointers = response.body.errors.map(
      (error: { pointer: string }) => error.pointer,
    );
    expect(pointers).toEqual(expect.arrayContaining(['#/email', '#/password']));
  });

  it('clears the session cookie on logout', async () => {
    const response = await request(server())
      .post('/v1/auth/logout')
      .expect(204);

    const cookie = sessionCookie(response);
    expect(cookie).toContain('session=;');
    expect(cookie).toContain('Expires=Thu, 01 Jan 1970');
  });
});
