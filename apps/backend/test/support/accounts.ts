import request from 'supertest';
import type { App } from 'supertest/types.js';

export const PASSWORD = 'correct horse battery';

export interface Account {
  id: string;
  email: string;
  // `session=<token>`, ready for a Cookie header.
  cookie: string;
}

export function newEmail(): string {
  return `${Bun.randomUUIDv7()}@example.com`;
}

export function sessionCookie(response: request.Response): string {
  const cookie = response
    .get('Set-Cookie')
    ?.find((cookie) => cookie.startsWith('session='));
  if (!cookie) {
    throw new Error('Expected a session cookie');
  }
  return cookie;
}

export async function registerAccount(
  server: App,
  name = 'Ada',
): Promise<Account> {
  const email = newEmail();
  const response = await request(server)
    .post('/v1/auth/register')
    .send({ email, name, password: PASSWORD })
    .expect(201);
  return {
    id: response.body.id,
    email,
    cookie: sessionCookie(response).split(';')[0],
  };
}
